import { AIAnalysisResult } from "../types";

export const analyzeDataPacket = async (
  content: string | ArrayBuffer, 
  source: string
): Promise<AIAnalysisResult> => {
  
  // Simulation of processing delay
  await new Promise(resolve => setTimeout(resolve, 200));

  let dataType = "Unknown Data";
  let summary = "Data received by system core.";
  let tags: string[] = ["raw", "unprocessed"];
  let fields: Record<string, any> = {};
  let risk = "Low";
  
  if (content instanceof ArrayBuffer) {
     const size = content.byteLength;
     dataType = "Binary Stream";
     summary = `Binary blob of ${size} bytes captured.`;
     tags = ["binary", "hex"];
     
     // Simple Magic Byte Check (First 4 bytes)
     const view = new Uint8Array(content.slice(0, 4));
     const hex = Array.from(view).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
     
     if (hex.startsWith("89504E47")) dataType = "PNG Image";
     else if (hex.startsWith("FFD8FF")) dataType = "JPEG Image";
     else if (hex.startsWith("25504446")) dataType = "PDF Document";
     else if (hex.startsWith("504B0304")) dataType = "ZIP Archive";
     
     fields["MagicBytes"] = hex;
     fields["Size"] = size;

  } else {
     const text = content.trim();

     // 1. Try Parsing as URL Parameters (Query String)
     // Heuristic: Must contain '=' and shouldn't contain newline chars usually found in code
     if (text.includes('=') && !text.includes('\n') && !text.includes('{') && !text.includes('}')) {
        try {
           const params = new URLSearchParams(text);
           const entries: Record<string, string> = {};
           let count = 0;
           params.forEach((v, k) => {
              entries[k] = v;
              count++;
           });
           
           if (count > 0) {
              dataType = "URL Parameters";
              summary = `Parsed ${count} key-value pair(s) from query string.`;
              tags = ["url-params", "structured", "key-value"];
              fields = entries;
              
              if (entries['password'] || entries['token'] || entries['key'] || entries['secret']) {
                 risk = "High";
                 tags.push("credentials");
              }
              return { dataType, summary, extractedFields: fields, tags, securityRisk: risk, geoEstimate: "System" };
           }
        } catch (e) {
           // Continue to next check
        }
     }

     // 2. Try JSON
     if ((text.startsWith("{") && text.endsWith("}")) || (text.startsWith("[") && text.endsWith("]"))) {
         try {
             const json = JSON.parse(text);
             dataType = "JSON Object";
             summary = "Structured JSON data payload.";
             tags = ["json", "data-structure"];
             // Extract top-level keys
             if (!Array.isArray(json)) {
                 Object.keys(json).forEach(k => {
                     const val = json[k];
                     // Flatten slightly for table view
                     fields[k] = typeof val === 'object' ? JSON.stringify(val).slice(0, 50) + (JSON.stringify(val).length > 50 ? '...' : '') : String(val);
                 });
             } else {
                 fields["Array Length"] = json.length;
                 fields["Sample"] = JSON.stringify(json[0]).slice(0, 50);
                 dataType = "JSON Array";
             }
         } catch (e) {
            dataType = "Malformed JSON";
         }
     } 
     // 3. Code & Script detection
     else if (text.includes("function") || text.includes("const ") || text.includes("import ") || text.includes("class ")) {
         dataType = "Source Code";
         summary = "Executable code snippet detected.";
         tags = ["code", "script", "executable"];
         if (text.includes("react")) tags.push("react");
         if (text.includes("import")) tags.push("module");
         risk = "Medium"; 
     } 
     // 4. SQL
     else if (text.toLowerCase().includes("select") && text.toLowerCase().includes("from")) {
         dataType = "SQL Query";
         summary = "Database query statement.";
         tags = ["database", "sql"];
         risk = "Medium";
     } 
     // 5. Links
     else if (text.includes("http://") || text.includes("https://")) {
         dataType = "URL List / Link";
         summary = "Content contains web identifiers.";
         tags = ["url", "web"];
         fields["URL Found"] = text.match(/https?:\/\/[^\s]+/)?.[0] || "Multiple";
     } 
     // 6. Email/PII
     else if (text.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/)) {
         dataType = "PII / Email List";
         summary = "Potential personal identifiable information detected.";
         tags = ["email", "privacy-risk"];
         risk = "High";
         const matches = text.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g);
         if (matches) {
            fields["Email Count"] = matches.length;
            fields["Samples"] = matches.slice(0, 3).join(", ");
         }
     } else {
         dataType = "Plain Text";
         summary = `Text payload of ${text.length} characters.`;
         tags = ["text"];
     }

     // Generic PII check
     if (text.toLowerCase().includes("password") || text.toLowerCase().includes("key") || text.toLowerCase().includes("secret")) {
         risk = "High";
         tags.push("credential-risk");
     }
  }

  return {
    dataType,
    summary,
    extractedFields: fields,
    tags,
    securityRisk: risk,
    geoEstimate: "Local/System"
  };
};