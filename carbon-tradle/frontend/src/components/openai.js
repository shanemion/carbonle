// import React, { useEffect, useState } from "react";
// import OpenAI from "openai";

// const OpenAIChat = ({ targetCountry, showAIChatModal }) => {
//   const [response, setResponse] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
//   // write a useEffect to print out targetCountry
//   useEffect(() => {
//     console.log('Target Country:', targetCountry);
//   }, []);

//   const fetchCompletion = async () => {
//     if (!OPENAI_API_KEY) {
//       setError("API key is missing");
//       return;
//     }

    
    
//     setLoading(true);
//     setError(null);
//     try {
//       const openai = new OpenAI({ apiKey: OPENAI_API_KEY, dangerouslyAllowBrowser: true });
//       const completion = await openai.chat.completions.create({
//         model: "gpt-4o-mini",
//         messages: [{ role: "user", content: `Provide an environmental summary on ${targetCountry}` }],
//       });
//       setResponse(completion.choices[0]?.message?.content || "No response received");
//     } catch (err) {
//       setError("Failed to fetch response");
//       console.error(err);
//     }
//     setLoading(false);
//   };

//   return (
//     <div>
//       <button onClick={fetchCompletion} disabled={loading}>
//         {loading ? "Generating..." : "Generate Response"}
//       </button>
//       {error && <p style={{ color: "red" }}>{error}</p>}
//       {response && <p><strong>Response:</strong> {response}</p>}
//     </div>
//   );
// };

// export default OpenAIChat;
import React, { useEffect, useState } from "react";
import OpenAI from "openai";

const OpenAIChat = ({ targetCountry, showModal }) => {
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

  // Log the target country whenever it changes
  useEffect(() => {
    console.log('Target Country:', targetCountry);
  }, [targetCountry]);

  // Whenever the AI chat modal is shown (true), automatically trigger the API call
  useEffect(() => {
    if (showModal && targetCountry) {
      fetchCompletion();
    }
  }, [showModal, targetCountry]);

  const fetchCompletion = async () => {
    if (!OPENAI_API_KEY) {
      setError("API key is missing");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Initialize the client
      const openai = new OpenAI({ 
        apiKey: OPENAI_API_KEY,
        dangerouslyAllowBrowser: true
      });

      // Create a chat completion request
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Provide an environmental summary on ${targetCountry}`,
          },
        ],
      });

      const content = completion.choices[0]?.message?.content || "No response received";
      setResponse(content);
    } catch (err) {
      setError("Failed to fetch response");
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        // Basic modal-like styling
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: "600px",
        maxHeight: "400px", // limit height
        margin: "0 auto",
        backgroundColor: "#fff",
        borderRadius: "8px",
        overflowY: "auto", // vertical scroll
        padding: "1rem",
      }}
    >
      {/* Loading/Error/Response states */}
      {loading && <h2>Wait! Generating Your AI Climate Lesson on {targetCountry}!...</h2>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {response && (
        <div style={{ whiteSpace: "pre-line" }}>
          <strong></strong> {response}
        </div>
      )}
    </div>
  );
};

export default OpenAIChat;
