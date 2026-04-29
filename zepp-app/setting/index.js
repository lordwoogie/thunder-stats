AppSettingsPage({
  state: {},

  build(props) {
    const { settingsStorage, getLanguage } = props;
    const apiKey = settingsStorage.getItem("apiKey") || "";

    return Section(
      {
        style: { paddingTop: "16px", paddingLeft: "16px", paddingRight: "16px" },
      },
      [
        Text(
          {
            style: {
              fontSize: "20px",
              color: "#007AC1",
              fontWeight: "bold",
              marginBottom: "8px",
              letterSpacing: "2px",
            },
          },
          "THUNDER STATS"
        ),
        Text(
          {
            style: {
              fontSize: "13px",
              color: "#888",
              marginBottom: "16px",
              lineHeight: "20px",
            },
          },
          "Live OKC Thunder scores on your watch. Powered by balldontlie.io — a free API. Get a key at app.balldontlie.io and paste it below."
        ),
        Section({ style: { marginBottom: "16px" } }, [
          Text(
            {
              style: {
                fontSize: "14px",
                color: "#222",
                marginBottom: "6px",
                fontWeight: "bold",
              },
            },
            "balldontlie.io API Key"
          ),
          TextInput({
            label: "API Key",
            placeholder: "Paste your API key here",
            value: apiKey,
            onChange: (val) => {
              settingsStorage.setItem("apiKey", (val || "").trim());
            },
          }),
        ]),
        Section({ style: { marginTop: "8px" } }, [
          Text(
            {
              style: { fontSize: "12px", color: "#888", lineHeight: "18px" },
            },
            "1. Sign up at app.balldontlie.io\n2. Copy your API key\n3. Paste it above and save\n4. Open Thunder Stats on your watch"
          ),
        ]),
      ]
    );
  },
});
