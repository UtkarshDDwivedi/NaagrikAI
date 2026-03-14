import logo from '../images/chhattisgarh-govt-logo.png'

export default function Header({ language, onLanguageChange }) {
  return (
    <header className="border-b border-[#d97706] bg-gov-primary text-white shadow-sm">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/40 bg-white/15 text-xl font-bold">
            <img src={logo} alt="chhattisgarh govt logo" className='rounded-full'/>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide">CSC ऑपरेटर डैशबोर्ड</h1>
            <p className="text-sm text-orange-50">नागरिक सेवाओं के लिए AI सहायक प्रणाली</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="rounded-md border border-white/30 bg-white/10 px-3 py-2">
            <button
              type="button"
              onClick={() => onLanguageChange("हिंदी")}
              className={language === "हिंदी" ? "font-bold text-white" : "text-orange-100"}
            >
              हिंदी
            </button>
            <span className="px-2 text-orange-100">|</span>
            <button
              type="button"
              onClick={() => onLanguageChange("English")}
              className={language === "English" ? "font-bold text-white" : "text-orange-100"}
            >
              English
            </button>
          </div>

          <div className="rounded-md border border-white/30 bg-white/10 px-3 py-2">ऑपरेटर: राहुल</div>

          <button type="button" className="rounded-md border border-white/40 bg-white px-4 py-2 font-semibold text-[#a64b00]">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
