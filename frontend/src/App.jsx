import { useCallback, useEffect, useMemo, useState } from "react";
import api from "./api/client";
import AIAssistantPanel from "./components/AIAssistantPanel";
import AlertBar from "./components/AlertBar";
import AnalyticsChart from "./components/AnalyticsChart";
import ApplicationTable from "./components/ApplicationTable";
import ChecklistValidator from "./components/ChecklistValidator";
import ConsistencyCheckCard from "./components/ConsistencyCheckCard";
import DashboardCards from "./components/DashboardCards";
import Header from "./components/Header";
import LLMRiskCard from "./components/LLMRiskCard";
import Sidebar from "./components/Sidebar";
import { deleteOfflineSubmission, listOfflineSubmissions, saveOfflineSubmission } from "./utils/offlineQueue";

const navItems = [
  { id: "dashboard", label: "CSC ऑपरेटर डैशबोर्ड", icon: "⌂" },
  { id: "new", label: "नया आवेदन", icon: "+" },
  { id: "list", label: "आवेदन सूची", icon: "≣" },
  { id: "verification", label: "दस्तावेज़ सत्यापन", icon: "✓" },
  { id: "eligibility", label: "योजना पात्रता", icon: "◎" },
  { id: "assistant", label: "AI सहायक", icon: "AI" },
  { id: "reports", label: "रिपोर्ट", icon: "▣" },
  { id: "settings", label: "सेटिंग्स", icon: "⚙" }
];

const applicationTypeOptions = [
  "Sand Mining",
  "Limestone",
  "Brick Kiln",
  "Infrastructure Project",
  "Income Certificate",
  "Pension Scheme"
];

const documentLabelMap = {
  aadhaar_card: "Aadhaar Card",
  pan_card: "PAN Card",
  income_certificate: "Income Certificate",
  marksheet: "Marksheet",
  passbook: "Passbook",
  caste_certificate: "Caste Certificate",
  processing_fee: "Processing Fee Receipt",
  pre_feasibility_report: "Pre-Feasibility Report",
  emp: "Environmental Management Plan",
  land_document: "Land Document",
  gram_panchayat_noc: "Gram Panchayat NOC",
  "200m_certificate": "200m Certificate",
  "500m_certificate": "500m Certificate",
  mining_plan: "Mining Plan",
  forest_noc: "Forest NOC",
  kml_file: "KML File",
  affidavit: "Affidavit",
  drone_video: "Drone Video",
  consent_to_establish: "Consent to Establish",
  site_plan: "Site Plan",
  environment_clearance: "Environment Clearance",
  project_report: "Project Report"
};

const applicationDocumentMap = {
  "Income Certificate": ["aadhaar_card", "passbook", "marksheet", "pan_card"],
  "Pension Scheme": ["aadhaar_card", "income_certificate", "passbook", "caste_certificate"],
  "Sand Mining": [
    "processing_fee",
    "pre_feasibility_report",
    "emp",
    "land_document",
    "gram_panchayat_noc",
    "200m_certificate",
    "500m_certificate",
    "mining_plan",
    "forest_noc",
    "kml_file",
    "affidavit",
    "drone_video"
  ],
  "Brick Kiln": ["processing_fee", "land_document", "consent_to_establish", "site_plan", "affidavit", "kml_file"],
  "Infrastructure Project": [
    "processing_fee",
    "land_document",
    "forest_noc",
    "environment_clearance",
    "project_report",
    "kml_file",
    "affidavit",
    "drone_video"
  ],
  Limestone: [
    "processing_fee",
    "pre_feasibility_report",
    "emp",
    "land_document",
    "mining_plan",
    "forest_noc",
    "kml_file",
    "affidavit",
    "drone_video"
  ]
};

const initialForm = {
  application_type: "Income Certificate",
  project_type: "",
  name: "",
  aadhaar_number: "",
  address: ""
};

const initialValidation = {
  missing_documents: [],
  document_statuses: {},
  mismatch_warnings: [],
  compliance_issues: [],
  risk_score: 0,
  risk_label: "Low",
  risk_method: "rule_based",
  risk_summary: "",
  risk_reasons: [],
  rule_based_risk_score: 0,
  rule_based_risk_label: "Low",
  llm_risk_score: null,
  llm_risk_label: null,
  llm_model: null,
  ai_suggestions: [
    {
      type: "starter",
      english: "Create an application and upload document paths to run the AI validation workflow.",
      hindi: "AI वैलिडेशन शुरू करने के लिए आवेदन बनाएं और दस्तावेज़ पथ अपलोड करें।"
    }
  ]
};

const initialApplicationRows = [];

const initialDocuments = Object.fromEntries(Object.keys(documentLabelMap).map((key) => [key, null]));

const statusLabelMap = {
  Ready: "तैयार",
  "AI validation completed": "AI जांच पूर्ण",
  "Create the application first": "पहले आवेदन बनाएं"
};

function normalizeLabel(value) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function riskToHindi(label) {
  if (label === "High") return "उच्च";
  if (label === "Medium") return "मध्यम";
  return "कम";
}

function toDisplayFileName(value) {
  if (!value) return "कोई फ़ाइल चयनित नहीं";
  return value.name || "selected-file";
}

function buildQueuedRow(submission) {
  return {
    id: submission.id,
    citizen: submission.form.name || "नया नागरिक",
    service: submission.form.application_type,
    status: "स्थानीय रूप से सहेजा गया",
    risk: "कम",
    aiWarning: submission.requestedValidation ? "Validation queued for sync" : "Offline save pending sync",
    action: "सिंक लंबित",
    isLocalOnly: true,
  };
}

export default function App() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [language, setLanguage] = useState("हिंदी");
  const [form, setForm] = useState(initialForm);
  const [documents, setDocuments] = useState(initialDocuments);
  const [applicationId, setApplicationId] = useState(null);
  const [validation, setValidation] = useState(initialValidation);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [hasValidated, setHasValidated] = useState(false);
  const [applicationRows, setApplicationRows] = useState(initialApplicationRows);
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [queuedSubmissionId, setQueuedSubmissionId] = useState(null);
  const [queuedCount, setQueuedCount] = useState(0);
  const [syncMessage, setSyncMessage] = useState("");
  const [syncing, setSyncing] = useState(false);
  const currentDocumentFields = useMemo(
    () =>
      (applicationDocumentMap[form.application_type] || []).map((key) => ({
        key,
        label: documentLabelMap[key] || normalizeLabel(key)
      })),
    [form.application_type]
  );

  const refreshApplications = useCallback(async () => {
    try {
      const [response, queuedSubmissions] = await Promise.all([
        api.get("/applications"),
        listOfflineSubmissions(),
      ]);
      const serverRows = response.data.map((item) => ({
        id: item.id,
        citizen: item.applicant_name,
        service: item.application_type,
        status: item.has_validation ? "समीक्षा पूर्ण" : "लंबित",
        risk: riskToHindi(item.risk_label),
        aiWarning: item.missing_documents?.[0]
          ? `${normalizeLabel(item.missing_documents[0])} missing`
          : item.mismatch_warnings?.[0] || "—",
        action: item.has_validation ? "सुधार" : "सत्यापित"
      }));
      const queuedRows = queuedSubmissions.map(buildQueuedRow);
      setApplicationRows([...queuedRows, ...serverRows]);
      setQueuedCount(queuedSubmissions.length);
    } catch (error) {
      // Keep the current local rows if refresh fails.
    }
  }, []);

  const syncOfflineSubmissions = useCallback(async () => {
    if (!navigator.onLine) {
      setSyncMessage("You are offline. Connect to the internet and try syncing again.");
      return;
    }

    const submissions = await listOfflineSubmissions();
    if (!submissions.length) {
      setQueuedCount(0);
      if (syncMessage) {
        setSyncMessage("");
      }
      return;
    }

    setSyncing(true);
    setSyncMessage(`Syncing ${submissions.length} locally saved application${submissions.length === 1 ? "" : "s"}...`);

    try {
      for (const submission of submissions) {
        const createResponse = await api.post("/applications", submission.form);
        const serverApplicationId = createResponse.data.id;

        if (submission.documents?.length) {
          const formData = new FormData();
          formData.append("application_id", String(serverApplicationId));
          submission.documents.forEach((document) => {
            const restoredFile = new File([document.blob], document.name, {
              type: document.type,
              lastModified: document.lastModified
            });
            formData.append(document.key, restoredFile);
          });

          await api.post("/upload-documents", formData, {
            headers: {
              "Content-Type": "multipart/form-data"
            }
          });
        }

        let syncedValidation = null;
        if (submission.requestedValidation) {
          const validationResponse = await api.post("/validate-checklist", {
            application_id: serverApplicationId,
            application_type: submission.form.application_type,
            uploaded_documents: submission.documents.map((document) => document.key),
            form_data: submission.form,
            extracted_documents: {}
          });
          syncedValidation = validationResponse.data;
        }

        if (queuedSubmissionId === submission.id) {
          setApplicationId(serverApplicationId);
          setQueuedSubmissionId(null);
          if (syncedValidation) {
            setValidation(syncedValidation);
            setHasValidated(true);
            setStatus("AI validation completed");
          } else {
            setValidation(initialValidation);
            setHasValidated(false);
            setStatus(`Application #${serverApplicationId} created`);
          }
        }

        await deleteOfflineSubmission(submission.id);
      }

      const remaining = await listOfflineSubmissions();
      setQueuedCount(remaining.length);
      setSyncMessage("Local submissions synced successfully.");
      await refreshApplications();
    } catch (error) {
      const message = error?.response?.data?.detail || error?.message || "Sync failed due to a network or server error.";
      setSyncMessage(`Sync failed: ${message}`);
    } finally {
      setSyncing(false);
    }
  }, [queuedSubmissionId, refreshApplications, syncMessage]);

  useEffect(() => {
    let mounted = true;

    const refreshQueueCount = async () => {
      const submissions = await listOfflineSubmissions();
      if (mounted) {
        setQueuedCount(submissions.length);
      }
    };

    const handleOnline = async () => {
      setIsOnline(true);
      await syncOfflineSubmissions();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncMessage("Internet connection is weak. New work will be stored locally.");
    };

    refreshQueueCount();
    refreshApplications();
    if (navigator.onLine) {
      syncOfflineSubmissions();
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      mounted = false;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [refreshApplications, syncOfflineSubmissions]);

  const snapshotDocumentsForQueue = async () => {
    const entries = await Promise.all(
      Object.entries(documents)
        .filter(([, value]) => value)
        .map(async ([key, value]) => ({
          key,
          name: value.name,
          type: value.type,
          lastModified: value.lastModified,
          blob: await value.arrayBuffer()
        }))
    );

    return entries;
  };

  const queueSubmission = async ({ requestedValidation }) => {
    const localId = queuedSubmissionId || `LOCAL-${Date.now()}`;
    const queuedDocuments = await snapshotDocumentsForQueue();
    const record = {
      id: localId,
      form,
      documents: queuedDocuments,
      requestedValidation,
      createdAt: new Date().toISOString()
    };

    await saveOfflineSubmission(record);
    setQueuedSubmissionId(localId);
    setQueuedCount((current) => current + (queuedSubmissionId ? 0 : 1));
    setApplicationId(localId);
    setHasValidated(false);
    setStatus(requestedValidation ? "Saved locally for sync and validation" : "Saved locally");
    setSyncMessage("Application saved locally and will sync automatically when the connection improves.");
    setApplicationRows((current) => [buildQueuedRow(record), ...current.filter((row) => row.id !== localId)]);
  };

  const openApplication = async (row) => {
    if (typeof row.id === "string" && row.id.startsWith("LOCAL-")) {
      setApplicationId(row.id);
      setStatus("Saved locally");
      return;
    }

    const response = await api.get(`/applications/${row.id}`);
    const application = response.data;
    setApplicationId(application.id);
    setForm({
      application_type: application.application_type,
      project_type: application.project_type,
      name: application.applicant_name,
      aadhaar_number: application.aadhaar_number,
      address: application.address
    });
    setDocuments(initialDocuments);
    setValidation(application.validation_result || initialValidation);
    setHasValidated(Boolean(application.validation_result));
    setStatus(application.validation_result ? "AI validation completed" : `Application #${application.id} created`);
  };

  const deleteApplicationRow = async (row) => {
    if (typeof row.id === "string" && row.id.startsWith("LOCAL-")) {
      await deleteOfflineSubmission(row.id);
      setApplicationRows((current) => current.filter((item) => item.id !== row.id));
      const submissions = await listOfflineSubmissions();
      setQueuedCount(submissions.length);
      if (applicationId === row.id) {
        setApplicationId(null);
        setValidation(initialValidation);
        setHasValidated(false);
        setStatus("Ready");
      }
      return;
    }

    await api.delete(`/applications/${row.id}`);
    await refreshApplications();
    if (applicationId === row.id) {
      setApplicationId(null);
      setValidation(initialValidation);
      setHasValidated(false);
      setStatus("Ready");
    }
  };

  const handleFormChange = (event) => {
    setHasValidated(false);
    const { name, value } = event.target;

    if (name === "application_type") {
      setDocuments((current) =>
        Object.fromEntries(
          Object.keys(current).map((key) => [key, (applicationDocumentMap[value] || []).includes(key) ? current[key] : null])
        )
      );
      setValidation(initialValidation);
    }

    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleDocumentChange = (event) => {
    const file = event.target.files?.[0];
    setHasValidated(false);
    setDocuments((current) => ({
      ...current,
      [event.target.name]: file || null
    }));
  };

  const createApplication = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (!isOnline) {
        await queueSubmission({ requestedValidation: false });
        return;
      }

      const response = await api.post("/applications", form);
      setApplicationId(response.data.id);
      setValidation(initialValidation);
      setHasValidated(false);
      setStatus(`Application #${response.data.id} created`);
      await refreshApplications();
    } catch (error) {
      await queueSubmission({ requestedValidation: false });
    } finally {
      setLoading(false);
    }
  };

  const updateApplication = async () => {
    if (!applicationId) {
      setStatus("Create the application first");
      return;
    }

    if (typeof applicationId === "string" && applicationId.startsWith("LOCAL-")) {
      setApplicationRows((current) =>
        current.map((row) =>
          row.id === applicationId
            ? {
                ...row,
                citizen: form.name || "नया नागरिक",
                service: form.application_type
              }
            : row
        )
      );
      setStatus("Local application updated");
      setSyncMessage("Local application details updated. They will sync when connectivity improves.");
      return;
    }

    setLoading(true);
    try {
      await api.put(`/applications/${applicationId}`, form);
      await refreshApplications();
      setStatus(`Application #${applicationId} updated`);
    } finally {
      setLoading(false);
    }
  };

  const runValidation = async () => {
    if (!applicationId) {
      setStatus("Create the application first");
      return;
    }

    const uploadedDocuments = Object.entries(documents)
      .filter(([, value]) => value)
      .map(([key]) => key);

    setLoading(true);
    try {
      if (!isOnline || queuedSubmissionId || String(applicationId || "").startsWith("LOCAL-")) {
        await queueSubmission({ requestedValidation: true });
        return;
      }

      const formData = new FormData();
      formData.append("application_id", String(applicationId));
      Object.entries(documents)
        .filter(([, value]) => value)
        .forEach(([key, value]) => {
          formData.append(key, value);
        });

      await api.post("/upload-documents", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      const response = await api.post("/validate-checklist", {
        application_id: applicationId,
        application_type: form.application_type,
        uploaded_documents: uploadedDocuments,
        form_data: form,
        extracted_documents: {}
      });

      setValidation(response.data);
      setHasValidated(true);
      setStatus("AI validation completed");
      await refreshApplications();
    } catch (error) {
      await queueSubmission({ requestedValidation: true });
    } finally {
      setLoading(false);
    }
  };

  const metrics = useMemo(
    () => [
      { title: "आज प्राप्त आवेदन", value: 25, tone: "info" },
      { title: "लंबित आवेदन", value: 10, tone: "warning" },
      { title: "अस्वीकृत दस्तावेज़", value: Math.max(validation.missing_documents?.length || 0, 3), tone: "error" },
      { title: "AI सुझाव", value: Math.max(validation.ai_suggestions?.length || 0, 14), tone: "success" }
    ],
    [validation]
  );

  const alerts = useMemo(() => {
    const dynamicAlerts = [];

    if (validation.missing_documents?.length) {
      dynamicAlerts.push(`⚠ ${normalizeLabel(validation.missing_documents[0])} नहीं मिला`);
    }

    if (validation.mismatch_warnings?.length) {
      dynamicAlerts.push(`⚠ आवेदन #${applicationId ?? "P-771"} में असंगति`);
    }

    if (validation.compliance_issues?.length) {
      dynamicAlerts.push(`⚠ ${validation.compliance_issues[0]}`);
    }

    return [
      "⚠ आधार दस्तावेज़ नहीं मिला",
      "⚠ PAN कार्ड संख्या और आवेदन विवरण मेल नहीं खा रहे",
      "⚠ पेंशन योजना के लिए आय प्रमाण पत्र उपलब्ध नहीं है",
      ...dynamicAlerts
    ];
  }, [applicationId, validation]);

  const checklistItems = useMemo(
    () =>
      currentDocumentFields.map((field) => ({
        label: field.label,
        key: field.key,
        status: validation.document_statuses?.[field.key]?.status || (hasValidated ? "missing" : "pending"),
        issues: validation.document_statuses?.[field.key]?.issues || []
      })),
    [currentDocumentFields, hasValidated, validation]
  );

  const chartData = useMemo(
    () => ({
      labels: ["कुल आवेदन", "प्रसंस्कृत आवेदन", "अनुमोदन दर"],
      datasets: [
        {
          label: "सेवा स्थिति",
          data: [25, 18, 72],
          backgroundColor: ["#2196f3", "#f28c28", "#4caf50"],
          borderColor: ["#1c7ed6", "#d97706", "#388e3c"],
          borderWidth: 1
        }
      ]
    }),
    []
  );

  const sessionStatus = statusLabelMap[status] || status;

  return (
    <div className="min-h-screen bg-gov-page text-slate-900">
      <Header language={language} onLanguageChange={setLanguage} />
      <div className="mx-auto flex w-full max-w-[1600px] gap-4 px-4 py-4">
        <Sidebar items={navItems} activeItem={activeNav} onSelect={setActiveNav} />

        <main className="grid min-w-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1.45fr)_360px]">
          <section className="min-w-0 space-y-4">
            <DashboardCards metrics={metrics} />
            <AlertBar alerts={alerts} />

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
              <section className="rounded-md border border-gov-border bg-white shadow-gov">
                <div className="border-b border-gov-border bg-gov-section px-4 py-3">
                  <h2 className="text-base font-bold text-slate-900">नया आवेदन / New Application</h2>
                  <p className="mt-1 text-sm text-slate-600">CSC ऑपरेटर द्वारा आवेदन प्रविष्टि</p>
                </div>

                <form onSubmit={createApplication} className="grid gap-4 p-4 md:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700">
                    सेवा प्रकार / Application Type
                    <select
                      name="application_type"
                      value={form.application_type}
                      onChange={handleFormChange}
                      className="gov-input"
                    >
                      {applicationTypeOptions.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-sm font-medium text-slate-700">
                    परियोजना / Project Type
                    <input
                      name="project_type"
                      value={form.project_type}
                      onChange={handleFormChange}
                      className="gov-input"
                      placeholder="Riverbed Sand Extraction"
                    />
                  </label>

                  <label className="text-sm font-medium text-slate-700">
                    नागरिक नाम / Applicant Name
                    <input name="name" value={form.name} onChange={handleFormChange} className="gov-input" placeholder="Ramesh Kumar" />
                  </label>

                  <label className="text-sm font-medium text-slate-700">
                    आधार संख्या / Aadhaar No.
                    <input
                      name="aadhaar_number"
                      value={form.aadhaar_number}
                      onChange={handleFormChange}
                      className="gov-input"
                      maxLength={12}
                      placeholder="123412341234"
                    />
                  </label>

                  <label className="text-sm font-medium text-slate-700 md:col-span-2">
                    पता / Address
                    <textarea
                      name="address"
                      value={form.address}
                      onChange={handleFormChange}
                      rows={3}
                      className="gov-input"
                      placeholder="Gram / Tehsil / District"
                    />
                  </label>

                  <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                    <button type="submit" disabled={loading} className="gov-button-primary">
                      {loading ? "प्रक्रिया जारी..." : "आवेदन बनाएँ"}
                    </button>
                  <button
                    type="button"
                    onClick={updateApplication}
                      disabled={loading || !applicationId}
                      className="gov-button-secondary"
                    >
                      आवेदन अपडेट करें
                    </button>
                    <div className="rounded-md border border-gov-border bg-gov-section px-3 py-2 text-sm text-slate-700">
                      आवेदन ID: <span className="font-semibold">{applicationId ?? "अभी नहीं बना"}</span>
                    </div>
                  <div className="rounded-md border border-gov-border bg-gov-section px-3 py-2 text-sm text-slate-700">
                    स्थिति: <span className="font-semibold">{sessionStatus}</span>
                  </div>
                  <div className="rounded-md border border-gov-border bg-gov-section px-3 py-2 text-sm text-slate-700">
                    नेटवर्क: <span className="font-semibold">{isOnline ? "Online" : "Offline"}</span>
                  </div>
                  <div className="rounded-md border border-gov-border bg-gov-section px-3 py-2 text-sm text-slate-700">
                    Pending Sync: <span className="font-semibold">{queuedCount}</span>
                  </div>
                  <button type="button" onClick={syncOfflineSubmissions} disabled={syncing} className="gov-button-secondary">
                    {syncing ? "Syncing..." : "Sync Now"}
                  </button>
                </div>
              </form>
            </section>

              <section className="rounded-md border border-gov-border bg-white shadow-gov">
                <div className="border-b border-gov-border bg-gov-section px-4 py-3">
                  <h2 className="text-base font-bold text-slate-900">दस्तावेज़ प्रविष्टि / Document Entry</h2>
                  <p className="mt-1 text-sm text-slate-600">फ़ाइल पथ या दस्तावेज़ संदर्भ भरें</p>
                </div>

                <div className="grid gap-4 p-4">
                  {currentDocumentFields.map((field) => (
                    <label key={field.key} className="text-sm font-medium text-slate-700">
                      {field.label}
                      <div className="mt-1 rounded-md border border-gov-border bg-white p-3">
                        <input
                          type="file"
                          name={field.key}
                          onChange={handleDocumentChange}
                          className="block w-full text-sm text-slate-700 file:mr-3 file:rounded file:border-0 file:bg-gov-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#db7f1b]"
                        />
                        <p className="mt-2 text-xs text-slate-500">Selected: {toDisplayFileName(documents[field.key])}</p>
                      </div>
                    </label>
                  ))}

                  <p className="rounded-md border border-gov-border bg-gov-section px-3 py-2 text-xs text-slate-600">
                    नोट: चुनी गई फ़ाइल सर्वर पर अपलोड होकर OCR और document-type validation से जांची जाएगी।
                  </p>

                  <p className="rounded-md border border-gov-border bg-[#fafafa] px-3 py-2 text-xs text-slate-600">
                    Selected service requires {currentDocumentFields.length} document{currentDocumentFields.length === 1 ? "" : "s"}.
                  </p>

                  <button type="button" onClick={runValidation} disabled={loading} className="gov-button-secondary">
                    {loading ? "AI जांच चल रही है..." : "AI सत्यापन चलाएँ"}
                  </button>

                  {syncMessage ? (
                    <p className="rounded-md border border-gov-border bg-[#fafafa] px-3 py-2 text-xs text-slate-600">{syncMessage}</p>
                  ) : null}
                </div>
              </section>
            </div>

            <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
              <ChecklistValidator items={checklistItems} hasValidated={hasValidated} />
              <ApplicationTable rows={applicationRows} onOpen={openApplication} onDelete={deleteApplicationRow} />
            </div>

            <ConsistencyCheckCard warnings={validation.mismatch_warnings} hasValidated={hasValidated} />

            <LLMRiskCard validation={validation} hasValidated={hasValidated} />

            <AnalyticsChart data={chartData} />
          </section>

          <AIAssistantPanel
            applicationId={applicationId}
            validation={validation}
            status={sessionStatus}
            applicantName={form.name}
            applicationType={form.application_type}
            uploadedDocumentCount={Object.values(documents).filter(Boolean).length}
            language={language}
            hasValidated={hasValidated}
          />
        </main>
      </div>
    </div>
  );
}
