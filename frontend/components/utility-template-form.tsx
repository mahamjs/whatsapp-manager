"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface TemplateComponent {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
  format?: "TEXT";
  text?: string;
  example?: Record<string, string[] | string[][]>;
  buttons?: Array<{
    type: "QUICK_REPLY" | "PHONE_NUMBER" | "URL";
    text: string;
    phone_number?: string;
    url?: string;
  }>;
}

interface TemplatePayload {
  name: string;
  language: string;
  category: "UTILITY";
  components: TemplateComponent[];
}

interface UtilityTemplateFormProps {
  template?: {
    name: string;
    language: string;
  } | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function UtilityTemplateForm({ template, onSuccess, onCancel }: UtilityTemplateFormProps) {
  const { user } = useAuth();
  const [name, setName] = useState(template?.name || "");
  const [language] = useState("en_US");
  const [headerText, setHeaderText] = useState("");
  const [headerExample, setHeaderExample] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [bodyExamplesRaw, setBodyExamplesRaw] = useState("");
  const [footerText, setFooterText] = useState("");
  const [includeButton, setIncludeButton] = useState(false);
  const [buttonText, setButtonText] = useState("");
  const [buttonType, setButtonType] = useState<"QUICK_REPLY" | "URL" | "PHONE_NUMBER">("QUICK_REPLY");
  const [buttonValue, setButtonValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string>("");

  useEffect(() => {
    let previewHeader = headerText;
    let previewBody = bodyText;

    const headerVars = headerText.match(/\{\{\d+}}/g) || [];
    const variable = headerVars[0];
    if (variable && headerExample) {
      previewHeader = headerText.replace(variable, headerExample);
    }

    const bodyVars = bodyText.match(/\{\{\d+}}/g) || [];
    const bodyValues = bodyExamplesRaw.split(",").map(s => s.trim());
    bodyVars.forEach((v, idx) => {
      previewBody = previewBody.replace(v, bodyValues[idx] || "");
    });

    const previewText = `${previewHeader}\n\n${previewBody}\n\n${footerText}`;
    setPreview(previewText);
  }, [headerText, headerExample, bodyText, bodyExamplesRaw, footerText]);

  const validate = (): string | null => {
    if (!name.trim()) return "Template name is required.";
    if (!/^([a-z0-9_]{1,512})$/.test(name)) return "Template name must be lowercase, alphanumeric, and may include underscores.";
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    const components: TemplateComponent[] = [];

    if (headerText.trim()) {
      const headerComponent: TemplateComponent = {
        type: "HEADER",
        format: "TEXT",
        text: headerText,
      };
      const headerVars = headerText.match(/\{\{\d+}}/g) || [];
      if (headerVars.length > 0 && headerExample.trim()) {
        headerComponent.example = { header_text: [headerExample] };
      }
      components.push(headerComponent);
    }

    if (bodyText.trim()) {
      const bodyComponent: TemplateComponent = {
        type: "BODY",
        text: bodyText,
      };
      const bodyVars = bodyText.match(/\{\{\d+}}/g) || [];
      const bodyValues = bodyExamplesRaw.split(",").map(s => s.trim());
      if (bodyVars.length > 0 && bodyExamplesRaw.trim()) {
        bodyComponent.example = { body_text: [bodyValues] };
      }
      components.push(bodyComponent);
    }

    if (footerText.trim()) {
      components.push({
        type: "FOOTER",
        text: footerText
      });
    }

    if (includeButton && buttonText.trim()) {
      const buttonComponent: TemplateComponent = {
        type: "BUTTONS",
        buttons: [
          {
            type: buttonType,
            text: buttonText,
            ...(buttonType === "PHONE_NUMBER" ? { phone_number: buttonValue } : {}),
            ...(buttonType === "URL" ? { url: buttonValue } : {})
          }
        ]
      };
      components.push(buttonComponent);
    }

    const payload: TemplatePayload = {
      name,
      language,
      category: "UTILITY",
      components
    };

    try {
      const response = await fetch("/templates/submit", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data?.error?.error?.message || data?.error || "Failed to submit utility template.";
        throw new Error(message);
      }

      alert("Utility template submitted successfully!");
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Create Utility Template</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name *</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., delivery_update"
              disabled={!!template}
            />
            <p className="text-sm text-muted-foreground">Use lowercase letters, numbers, and underscores.</p>
          </div>

          <div className="space-y-2">
            <Label>Language</Label>
            <Input value={language} disabled />
            <p className="text-sm text-muted-foreground">Fixed to en_US.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="header-text">Header Text (optional)</Label>
            <Input
              id="header-text"
              value={headerText}
              onChange={(e) => setHeaderText(e.target.value)}
              placeholder="e.g., Order #{{1}}"
            />
          </div>

          {/\{\{\d+}}/.test(headerText) && (
            <div className="space-y-2">
              <Label htmlFor="header-example">Header Example</Label>
              <Input
                id="header-example"
                value={headerExample}
                onChange={(e) => setHeaderExample(e.target.value)}
                placeholder="e.g., 12345"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="body-text">Body Text *</Label>
            <Input
              id="body-text"
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder="e.g., Your order #{{1}} will arrive by {{2}}."
            />
          </div>

          {/\{\{\d+}}/.test(bodyText) && (
            <div className="space-y-2">
              <Label htmlFor="body-examples">Body Examples (comma separated)</Label>
              <Input
                id="body-examples"
                value={bodyExamplesRaw}
                onChange={(e) => setBodyExamplesRaw(e.target.value)}
                placeholder="e.g., 12345, August 10"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="footer-text">Footer Text (optional)</Label>
            <Input
              id="footer-text"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder="e.g., Questions? Contact support."
            />
          </div>

          <div className="space-y-2">
            <Label>
              <input
                type="checkbox"
                checked={includeButton}
                onChange={(e) => setIncludeButton(e.target.checked)}
                className="mr-2"
              />
              Include Button (optional)
            </Label>
          </div>

          {includeButton && (
            <div className="space-y-2">
              <Label htmlFor="button-text">Button Text</Label>
              <Input
                id="button-text"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                placeholder="e.g., Contact Support"
              />

              <Label htmlFor="button-type">Button Type</Label>
              <select
                id="button-type"
                value={buttonType}
                onChange={(e) => setButtonType(e.target.value as any)}
                className="w-full border rounded p-2"
              >
                <option value="QUICK_REPLY">Quick Reply</option>
                <option value="URL">URL</option>
                <option value="PHONE_NUMBER">Phone Number</option>
              </select>

              {(buttonType === "URL" || buttonType === "PHONE_NUMBER") && (
                <div className="space-y-2">
                  <Label htmlFor="button-value">{buttonType === "URL" ? "URL" : "Phone Number"}</Label>
                  <Input
                    id="button-value"
                    value={buttonValue}
                    onChange={(e) => setButtonValue(e.target.value)}
                    placeholder={buttonType === "URL" ? "https://example.com" : "+1234567890"}
                  />
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Template Preview</Label>
            <pre className="p-2 border rounded bg-gray-100 whitespace-pre-wrap">{preview}</pre>
          </div>

        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Submitting..." : template ? "Update Template" : "Submit Template"}
        </Button>
      </div>
    </div>
  );
}
