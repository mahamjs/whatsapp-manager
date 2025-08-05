// "use client";

// import { useEffect, useState } from "react";
// import AuthenticationTemplateForm from "./authentication-template-form";
// import GeneralTemplateForm from "./general-template-form";
// import MarketingTemplateForm from "./marketing-template-form";

// interface TemplateComponent {
//   type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
//   format?: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
//   text?: string;
//   example?: any;
//   buttons?: any[];
// }

// interface Template {
//   id?: string;
//   name: string;
//   category: string;
//   language: string;
//   components: TemplateComponent[];
//   status?: string;
// }

// interface TemplateCreatorProps {
//   template?: Template | null;
//   onSuccess: () => void;
//   onCancel: () => void;
// }

// export default function TemplateCreator({ template, onSuccess, onCancel }: TemplateCreatorProps) {
//   const [templateCategory, setTemplateCategory] = useState<string>("");

//   useEffect(() => {
//     if (template?.category) {
//       setTemplateCategory(template.category);
//     }
//   }, [template]);

//   const handleCategorySelect = (category: string) => {
//     setTemplateCategory(category);
//   };

//   if (!template && !templateCategory) {
//     // Render category selection if creating a new template
//     return (
//       <div className="space-y-4">
//         <h2 className="text-lg font-semibold">Select Template Category</h2>
//         <div className="flex gap-4">
//           {["AUTHENTICATION", "MARKETING", "UTILITY"].map((cat) => (
//             <button
//               key={cat}
//               onClick={() => handleCategorySelect(cat)}
//               className="px-4 py-2 border rounded hover:bg-gray-100"
//             >
//               {cat}
//             </button>
//           ))}
//         </div>
//       </div>
//     );
//   }

//   return templateCategory === "AUTHENTICATION" ? (
//     <AuthenticationTemplateForm template={template} onSuccess={onSuccess} onCancel={onCancel} />
//   ) : (
// <GeneralTemplateForm
//   initialTemplate={template}
//   onSubmit={onSuccess}
//   onCancel={onCancel}
// />
//   );
// }

"use client";

import { useEffect, useState } from "react";
import AuthenticationTemplateForm from "./authentication-template-form";
import MarketingTemplateForm from "./marketing-template-form";
import UtilityTemplateForm from "./utility-template-form"; // Create this component
import GeneralTemplateForm from "./general-template-form"; // Optional fallback

interface TemplateComponent {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
  format?: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
  text?: string;
  example?: any;
  buttons?: any[];
}

interface Template {
  id?: string;
  name: string;
  category: string;
  language: string;
  components: TemplateComponent[];
  status?: string;
}

interface TemplateCreatorProps {
  template?: Template | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TemplateCreator({ template, onSuccess, onCancel }: TemplateCreatorProps) {
  const [templateCategory, setTemplateCategory] = useState<string>("");

  useEffect(() => {
    if (template?.category) {
      setTemplateCategory(template.category);
    }
  }, [template]);

  const handleCategorySelect = (category: string) => {
    setTemplateCategory(category);
  };

  if (!template && !templateCategory) {
    // Render category selection if creating a new template
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Select Template Category</h2>
        <div className="flex gap-4">
          {["AUTHENTICATION", "MARKETING", "UTILITY"].map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategorySelect(cat)}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Render specific form based on category
  switch (templateCategory) {
    case "AUTHENTICATION":
      return <AuthenticationTemplateForm template={template} onSuccess={onSuccess} onCancel={onCancel} />;
    case "MARKETING":
      return <MarketingTemplateForm template={template} onSuccess={onSuccess} onCancel={onCancel} />;
    case "UTILITY":
      return <UtilityTemplateForm template={template} onSuccess={onSuccess} onCancel={onCancel} />;
    default:
      // Optional fallback to GeneralTemplateForm
      return <GeneralTemplateForm initialTemplate={template} onSubmit={onSuccess} onCancel={onCancel} />;
  }
}
