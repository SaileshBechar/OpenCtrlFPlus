interface ConfigGroup {
  dev : Config;
  staging: Config;
  prod : Config;
}

const config: ConfigGroup = {
  dev: {
    CLIENT_BASE_URL: "http://localhost:3000",
    API_BASE_URL: "http://localhost:5000",
    INDEX_PDF_URL: "/index_new_pdf",
  },
  staging: {
    CLIENT_BASE_URL: "http://localhost:3000",
    API_BASE_URL: "http://localhost:5000",
    INDEX_PDF_URL: "/index_new_pdf",
  },
  prod: {
    CLIENT_BASE_URL: "https://www.ctrlf.plus",
    API_BASE_URL: "https://ctrlfplus-production.up.railway.app",
    INDEX_PDF_URL: "/index_new_pdf",
  },
};

export default config[import.meta.env.VITE_ENV as keyof ConfigGroup|| "dev"];
