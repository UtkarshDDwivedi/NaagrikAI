import { useEffect, useRef, useState } from "react";

function toSentence(value) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function isHindiText(value) {
  return /[\u0900-\u097F]/.test(value);
}

function detectResponseMode(text) {
  const normalized = text.toLowerCase();

  if (isHindiText(text)) {
    return "hindi";
  }

  const hinglishKeywords = [
    "kya",
    "kaun",
    "kitna",
    "kyon",
    "kyu",
    "nahi",
    "nahin",
    "batao",
    "dikhao",
    "karna",
    "karo",
    "madad",
    "samjhao"
  ];

  if (hinglishKeywords.some((keyword) => normalized.includes(keyword))) {
    return "hinglish";
  }

  return "english";
}

function joinSentences(...parts) {
  return parts.filter(Boolean).join(" ");
}

function buildContext({ applicationId, validation, status, applicantName, applicationType, uploadedDocumentCount, hasValidated }) {
  const missingDocuments = validation.missing_documents || [];
  const detectedErrors = [...(validation.mismatch_warnings || []), ...(validation.compliance_issues || [])];
  const suggestions = validation.ai_suggestions || [];
  const topSuggestion = suggestions[0];

  return {
    applicationId: applicationId ?? "A-1092",
    applicantName: applicantName || "परीक्षण रिकॉर्ड",
    applicationType: applicationType || "Income Certificate",
    uploadedDocumentCount: uploadedDocumentCount ?? 0,
    status,
    hasValidated,
    missingDocuments,
    detectedErrors,
    topSuggestion,
    riskScore: Math.round(validation.risk_score ?? 0),
    riskLabel: validation.risk_label || "Medium",
    riskMethod: validation.risk_method || "rule_based",
    riskSummary: validation.risk_summary || "",
    riskReasons: validation.risk_reasons || [],
    llmModel: validation.llm_model || null,
    ruleBasedRiskScore: validation.rule_based_risk_score ?? 0,
    llmRiskScore: validation.llm_risk_score ?? null
  };
}

function buildAssistantReply(query, context) {
  const normalized = query.trim().toLowerCase();
  const mode = detectResponseMode(query);
  const missingDocsText = context.missingDocuments.length
    ? context.missingDocuments.map(toSentence).join(", ")
    : context.hasValidated
      ? "No required documents are missing right now"
      : "Validation has not been run yet";
  const errorsText = context.detectedErrors.length
    ? context.detectedErrors.join(", ")
    : context.hasValidated
      ? "No major mismatch has been detected yet"
      : "No validation result is available yet";
  const actionEnglish = context.topSuggestion?.english || "Upload the income certificate and verify Aadhaar details.";
  const actionHindi = context.topSuggestion?.hindi || "आय प्रमाण पत्र अपलोड करें और आधार विवरण पुनः जाँचें।";
  const uploadedDocsLine = `${context.uploadedDocumentCount} document${context.uploadedDocumentCount === 1 ? "" : "s"} uploaded`;
  const validationStepsEnglish = "Create the application, upload the required documents, then click AI validation.";
  const validationStepsHindi = "पहले आवेदन बनाएं, फिर आवश्यक दस्तावेज़ अपलोड करें, उसके बाद AI सत्यापन चलाएं।";

  const wantsMissingDocs =
    ["missing", "document", "docs", "required", "कौन", "दस्तावेज", "missing docs", "kami", "documents missing"].some((term) =>
      normalized.includes(term)
    );
  const wantsRisk =
    ["risk", "score", "danger", "issue", "error", "problem", "warning", "जोखिम", "गलती", "समस्या", "mismatch"].some((term) =>
      normalized.includes(term)
    );
  const wantsAction =
    ["what should", "next", "action", "suggest", "do now", "करें", "क्या कर", "agla", "karo", "karna"].some((term) =>
      normalized.includes(term)
    );
  const wantsStatus =
    ["status", "application", "applicant", "name", "स्थिति", "आवेदन", "आवेदक", "naam"].some((term) =>
      normalized.includes(term)
    );
  const wantsHelp =
    ["help", "assist", "capability", "use", "मदद", "क्या कर सकते", "kaise", "help me"].some((term) =>
      normalized.includes(term)
    );
  const wantsGreeting = ["hello", "hi", "hey", "namaste", "नमस्ते"].some((term) => normalized.includes(term));

  if (wantsMissingDocs) {
    if (!context.hasValidated) {
      if (mode === "hindi") {
        return joinSentences(
          "अभी validation शुरू नहीं हुई है।",
          validationStepsHindi,
          `फिलहाल ${context.uploadedDocumentCount} दस्तावेज़ चुने गए हैं, इसलिए मैं अभी final missing list नहीं बता सकता।`
        );
      }

      if (mode === "hinglish") {
        return joinSentences(
          "Abhi validation start nahi hui hai.",
          validationStepsEnglish,
          `Filhal ${uploadedDocsLine}, isliye missing documents ki final list abhi available nahi hai.`
        );
      }

      return joinSentences(
        "Validation has not been run yet.",
        validationStepsEnglish,
        `At the moment, there are ${uploadedDocsLine}, so I cannot confirm the final missing-document list yet.`
      );
    }

    if (mode === "hindi") {
      return context.missingDocuments.length
        ? joinSentences(
            `अभी लंबित दस्तावेज़ हैं: ${missingDocsText}.`,
            "पहले इन्हें अपलोड करें, फिर validation दोबारा चलाएँ ताकि मैं updated result बता सकूँ।"
          )
        : "अभी कोई required document missing नहीं है। उपलब्ध जानकारी के आधार पर दस्तावेज़ सूची पूरी लग रही है।";
    }

    if (mode === "hinglish") {
      return context.missingDocuments.length
        ? joinSentences(
            `Abhi missing documents hain: ${missingDocsText}.`,
            "Pehle inhe upload karo, phir validation dobara chalao."
          )
        : "Abhi koi required document missing nahi hai. Jo required checklist hai, uske hisaab se documents complete lag rahe hain.";
    }

    return context.missingDocuments.length
      ? joinSentences(
          `The missing documents are: ${missingDocsText}.`,
          "Please upload these first and then run validation again so I can confirm the updated status."
        )
      : "No required documents are currently missing. Based on the current validation result, the required checklist appears complete.";
  }

  if (wantsRisk) {
    if (!context.hasValidated) {
      if (mode === "hindi") {
        return joinSentences(
          "Risk assessment अभी उपलब्ध नहीं है क्योंकि validation नहीं चली है।",
          validationStepsHindi
        );
      }

      if (mode === "hinglish") {
        return joinSentences(
          "Risk assessment abhi available nahi hai kyunki validation nahi chali hai.",
          validationStepsEnglish
        );
      }

      return joinSentences(
        "The risk assessment is not available yet because validation has not been run.",
        validationStepsEnglish
      );
    }

    if (mode === "hindi") {
      return joinSentences(
        `वर्तमान risk score ${context.riskScore}% है और overall risk level ${context.riskLabel} है।`,
        `प्रमुख issues यह हैं: ${errorsText}.`,
        "अगर आप चाहें तो मैं next action भी बता सकता हूँ।"
      );
    }

    if (mode === "hinglish") {
      return joinSentences(
        `Risk score ${context.riskScore}% hai aur overall risk level ${context.riskLabel} hai.`,
        `Main issues ye hain: ${errorsText}.`,
        "Agar chaho to main next action bhi bata sakta hoon."
      );
    }

    return joinSentences(
      `The current risk score is ${context.riskScore}%, which places this application in the ${context.riskLabel} risk band.`,
      `The main issues I can see are: ${errorsText}.`,
      "If you want, I can also explain the next best action."
    );
  }

  if (wantsAction) {
    if (!context.hasValidated) {
      if (mode === "hindi") {
        return joinSentences(
          "अभी सबसे अच्छा अगला कदम यही है कि आप validation शुरू करें।",
          validationStepsHindi
        );
      }

      if (mode === "hinglish") {
        return joinSentences(
          "Abhi sabse useful next action validation start karna hai.",
          validationStepsEnglish
        );
      }

      return joinSentences(
        "The best next step is to start validation.",
        validationStepsEnglish
      );
    }

    if (mode === "hindi") {
      return joinSentences(
        `मेरी सलाह यह है: ${actionHindi}`,
        `यह सुझाव ${context.applicationType} application type के current validation result पर आधारित है।`
      );
    }

    if (mode === "hinglish") {
      return joinSentences(
        `Meri recommendation ye hai: ${actionEnglish}`,
        `Hindi mein kahe to: ${actionHindi}`
      );
    }

    return joinSentences(
      `My recommended next step is: ${actionEnglish}`,
      `This is based on the current ${context.applicationType} validation result.`
    );
  }

  if (wantsStatus) {
      if (mode === "hindi") {
      return joinSentences(
        `Application #${context.applicationId} की स्थिति ${context.status} है।`,
        `सेवा प्रकार ${context.applicationType} है और आवेदक का नाम ${context.applicantName} है।`
      );
    }

    if (mode === "hinglish") {
      return joinSentences(
        `Application #${context.applicationId} ka status ${context.status} hai.`,
        `Service ${context.applicationType} hai aur applicant ${context.applicantName} hai.`
      );
    }

    return joinSentences(
      `Application #${context.applicationId} is currently ${context.status}.`,
      `The selected service is ${context.applicationType}, and the applicant name is ${context.applicantName}.`
    );
  }

  if (wantsGreeting) {
      if (mode === "hindi") {
      return joinSentences(
        `नमस्ते। मैं ${context.applicationType} आवेदन में आपकी मदद कर सकता हूँ।`,
        "आप मुझसे missing documents, risk score, next action, या application status के बारे में पूछ सकते हैं।"
      );
    }

    if (mode === "hinglish") {
      return joinSentences(
        `Namaste. Main ${context.applicationType} application mein help kar sakta hoon.`,
        "Aap missing docs, risk score, next action, ya status puch sakte hain."
      );
    }

    return joinSentences(
      `Hello. I can help you with this ${context.applicationType} application.`,
      "You can ask about missing documents, risk score, next action, or the current status."
    );
  }

  if (wantsHelp || !normalized) {
      if (mode === "hindi") {
      return joinSentences(
        "आप मुझसे यह पूछ सकते हैं कि कौन से दस्तावेज़ missing हैं, risk score कितना है, अगला action क्या होना चाहिए, application status क्या है,",
        "या validation शुरू करने के steps क्या हैं। मैं इन सब पर context के साथ जवाब दूँगा।"
      );
    }

    if (mode === "hinglish") {
      return joinSentences(
        "Aap mujhse puch sakte hain ki kaunse documents missing hain, risk score kya hai, next action kya hona chahiye, application status kya hai,",
        "ya validation kaise start karni hai. Main in sab par context ke saath jawab dunga."
      );
    }

    return joinSentences(
      "You can ask about missing documents, the current risk score, the recommended next action, the application status,",
      "or how to start validation. I will answer using the current application context."
    );
  }

  if (mode === "hindi") {
    return context.hasValidated
      ? joinSentences(
          "मैंने आपके सवाल को process किया।",
          `अभी status ${context.status} है, risk ${context.riskScore}% है, और मेरी सलाह है: ${actionHindi}`
        )
      : joinSentences("मैं मदद के लिए तैयार हूँ।", validationStepsHindi);
  }

  if (mode === "hinglish") {
    return context.hasValidated
      ? joinSentences(
          "Maine aapka sawaal process kiya.",
          `Abhi status ${context.status} hai, risk ${context.riskScore}% hai, aur meri recommendation hai: ${actionEnglish}`
        )
      : joinSentences("Main help ke liye ready hoon.", validationStepsEnglish);
  }

  return context.hasValidated
    ? joinSentences(
        "I processed your request.",
        `Right now, the status is ${context.status}, the risk score is ${context.riskScore}%, and my recommendation is: ${actionEnglish}`
      )
    : joinSentences("I can help once validation starts.", validationStepsEnglish);
}

export default function AIAssistantPanel({
  applicationId,
  validation,
  status,
  applicantName,
  applicationType,
  uploadedDocumentCount,
  language,
  hasValidated
}) {
  const context = buildContext({ applicationId, validation, status, applicantName, applicationType, uploadedDocumentCount, hasValidated });
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognitionRef = useRef(null);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text:
        "Ask in English, हिंदी, or Hinglish. I can guide you on starting validation, checking missing documents, reviewing risk, and deciding the next action."
    }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [voiceMode, setVoiceMode] = useState("auto");
  const [voiceError, setVoiceError] = useState("");

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const submitQuery = (nextQuery) => {
    const trimmedQuery = nextQuery.trim();
    if (!trimmedQuery) {
      return;
    }

    const reply = buildAssistantReply(trimmedQuery, context);
    setMessages((current) => [...current, { role: "user", text: trimmedQuery }, { role: "assistant", text: reply }]);
    setQuery("");
  };

  const resolveSpeechLanguage = () => {
    if (voiceMode === "hindi") return "hi-IN";
    if (voiceMode === "english") return "en-IN";
    return language === "English" ? "en-IN" : "hi-IN";
  };

  const startListening = () => {
    if (!SpeechRecognition) {
      setVoiceError("Speech recognition is not supported in this browser. Use Chrome or Edge for mic input.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = resolveSpeechLanguage();
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      setVoiceError("");
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || "")
        .join(" ")
        .trim();

      setQuery(transcript);

      const finalResult = event.results[event.results.length - 1];
      if (finalResult?.isFinal && transcript) {
        submitQuery(transcript);
      }
    };

    recognition.onerror = (event) => {
      setVoiceError(`Voice input failed: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  return (
    <aside className="rounded-md border border-gov-border bg-white shadow-gov">
      <div className="border-b border-gov-border bg-gov-section px-4 py-3">
        <h2 className="text-base font-bold text-slate-900">AI सहायक (NagarikAI)</h2>
        <p className="mt-1 text-sm text-slate-600">Speech-enabled operator assistant for English, हिंदी, and Hinglish</p>
      </div>

      <div className="space-y-4 p-4 text-sm">
        <div className="rounded-md border border-gov-border bg-[#fafafa] p-3">
          <p className="font-semibold text-slate-800">Application #{context.applicationId}</p>
          <p className="mt-1 text-slate-600">आवेदक: {context.applicantName}</p>
          <p className="mt-1 text-slate-600">स्थिति: {context.status}</p>
        </div>

        <section>
          <h3 className="mb-2 font-semibold text-slate-800">Detected errors</h3>
          <div className="space-y-2">
            {context.detectedErrors.length ? (
              context.detectedErrors.map((item) => (
                <div key={item} className="rounded-md border border-[#f3b7b3] bg-[#fdeeee] px-3 py-2 text-[#b71c1c]">
                  ⚠ {item}
                </div>
              ))
            ) : !context.hasValidated ? (
              <div className="rounded-md border border-gov-border bg-[#fafafa] px-3 py-2 text-slate-600">Run validation to see document issues and mismatches</div>
            ) : (
              <div className="rounded-md border border-gov-border bg-[#fafafa] px-3 py-2 text-slate-600">No critical mismatch detected</div>
            )}
          </div>
        </section>

        <section>
          <h3 className="mb-2 font-semibold text-slate-800">Missing documents</h3>
          <div className="space-y-2">
            {context.missingDocuments.length ? (
              context.missingDocuments.map((item) => (
                <div key={item} className="rounded-md border border-[#f3b7b3] bg-[#fdeeee] px-3 py-2 text-[#b71c1c]">
                  ⚠ Missing {toSentence(item)}
                </div>
              ))
            ) : !context.hasValidated ? (
              <div className="rounded-md border border-gov-border bg-[#fafafa] px-3 py-2 text-slate-600">Create the application and run validation to check missing documents</div>
            ) : (
              <div className="rounded-md border border-[#b9dfbc] bg-[#edf7ee] px-3 py-2 text-[#2e7d32]">All required documents look present</div>
            )}
          </div>
        </section>

        <section className="rounded-md border border-[#f8d39f] bg-[#fff7e8] p-3">
          <p className="font-semibold text-slate-800">Risk Score: {context.riskScore}%</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
            Source: {context.riskMethod === "llm" ? `LLM${context.llmModel ? ` (${context.llmModel})` : ""}` : "Rule-based"}
          </p>
          <p className="mt-1 text-slate-700">Hindi: अस्वीकृति का जोखिम {context.riskLabel === "High" ? "उच्च" : context.riskLabel === "Medium" ? "मध्यम" : "कम"} है।</p>
          {context.riskMethod === "llm" ? (
            <p className="mt-2 text-slate-700">{context.riskSummary}</p>
          ) : (
            <p className="mt-2 text-slate-700">Rule-based baseline: {Math.round(context.ruleBasedRiskScore)}%</p>
          )}
          {context.riskReasons.length ? (
            <div className="mt-2 space-y-1 text-slate-700">
              {context.riskReasons.map((reason) => (
                <p key={reason}>• {reason}</p>
              ))}
            </div>
          ) : null}
        </section>

        <section className="rounded-md border border-[#b9dfbc] bg-[#edf7ee] p-3">
          <p className="font-semibold text-slate-800">Suggested Action:</p>
          <p className="mt-1 text-slate-700">{context.topSuggestion?.english || "Upload the income certificate and verify Aadhaar details."}</p>
          <p className="mt-2 text-slate-700">{context.topSuggestion?.hindi || "आय प्रमाण पत्र अपलोड करें और आधार विवरण पुनः जाँचें।"}</p>
        </section>

        <section className="rounded-md border border-gov-border bg-[#fcfcfc] p-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-slate-800">Talk to NagarikAI</h3>
            <select
              value={voiceMode}
              onChange={(event) => setVoiceMode(event.target.value)}
              className="rounded-md border border-gov-border bg-white px-2 py-1 text-xs text-slate-700 outline-none"
            >
              <option value="auto">Auto</option>
              <option value="hindi">Hindi</option>
              <option value="english">English</option>
            </select>
          </div>

          <div className="mt-3 space-y-2 rounded-md border border-gov-border bg-white p-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={
                  message.role === "assistant"
                    ? "rounded-md bg-[#f3f6fa] px-3 py-2 text-slate-700"
                    : "rounded-md bg-[#fff4e8] px-3 py-2 text-[#8a4300]"
                }
              >
                <span className="mr-2 font-semibold">{message.role === "assistant" ? "AI" : "You"}:</span>
                {message.text}
              </div>
            ))}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              submitQuery(query);
            }}
            className="mt-3 space-y-3"
          >
            <textarea
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              rows={3}
              className="gov-input mt-0"
              placeholder="Ask in English, हिंदी, or Hinglish. Example: kaunse docs missing hain?"
            />

            <div className="flex flex-wrap items-center gap-2">
              <button type="submit" className="gov-button-primary">
                Send
              </button>

              <button type="button" onClick={isListening ? stopListening : startListening} className="gov-button-secondary">
                {isListening ? "Stop Mic" : "Start Mic"}
              </button>

              <span className="text-xs text-slate-500">
                Mode: {voiceMode === "auto" ? `${language === "English" ? "English" : "Hindi"} auto` : voiceMode}
              </span>
            </div>
          </form>

          {voiceError ? <p className="mt-2 text-xs text-[#b71c1c]">{voiceError}</p> : null}

          <p className="mt-2 text-xs text-slate-500">
            Best effort speech support uses the browser&apos;s built-in recognition engine. Hinglish accuracy depends on browser support.
          </p>
        </section>
      </div>
    </aside>
  );
}
