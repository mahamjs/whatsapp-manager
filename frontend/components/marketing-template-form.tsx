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
    type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER";
    text: string;
    phone_number?: string;
    url?: string;
  }>;
}

interface TemplatePayload {
  name: string;
  language: string;
  category: "MARKETING";
  components: TemplateComponent[];
}

interface MarketingTemplateFormProps {
  template?: {
    name: string;
    language: string;
  } | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function MarketingTemplateForm({ template, onSuccess, onCancel }: MarketingTemplateFormProps) {
  const { user } = useAuth();
  const [name, setName] = useState(template?.name || "");
  const [language] = useState("en_US");
  const [headerText, setHeaderText] = useState("Our {{1}} is on!");
  const [headerExample, setHeaderExample] = useState("Summer Sale");
  const [bodyText, setBodyText] = useState("Shop now through {{1}} and use code {{2}} to get {{3}} off all merchandise.");
  const [bodyExamples, setBodyExamples] = useState(["the end of August", "25OFF", "25%"]);
  const [footerText, setFooterText] = useState("Use the button below to manage your marketing subscriptions.");
  const [quickReply1, setQuickReply1] = useState("Unsubscribe from Promos");
  const [urlButtonText, setUrlButtonText] = useState("Shop Now");
  const [urlButtonLink, setUrlButtonLink] = useState("https://example.com/shop");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string>("");

  useEffect(() => {
    const generatePreview = () => {
      return `${headerText.replace("{{1}}", headerExample)}\n\n${bodyText.replace("{{1}}", bodyExamples[0]).replace("{{2}}", bodyExamples[1]).replace("{{3}}", bodyExamples[2])}\n\n${footerText}`;
    };
    setPreview(generatePreview());
  }, [headerText, headerExample, bodyText, bodyExamples, footerText]);

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

    const components: TemplateComponent[] = [
      {
        type: "HEADER",
        format: "TEXT",
        text: headerText,
        example: { header_text: [headerExample] }
      },
      {
        type: "BODY",
        text: bodyText,
        example: { body_text: [[...bodyExamples]] }
      },
      {
        type: "FOOTER",
        text: footerText
      }
    ];

    const buttons: TemplateComponent["buttons"] = [];
    if (quickReply1.trim()) {
      buttons.push({ type: "QUICK_REPLY", text: quickReply1 });
    }
    if (urlButtonText.trim() && urlButtonLink.trim()) {
      buttons.push({ type: "URL", text: urlButtonText, url: urlButtonLink });
    }
    if (buttons.length > 0) {
      components.push({ type: "BUTTONS", buttons });
    }

    const payload: TemplatePayload = {
      name,
      language,
      category: "MARKETING",
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
        const message = data?.error?.error?.message || data?.error || "Failed to submit marketing template.";
        throw new Error(message);
      }

      alert("Marketing template submitted successfully!");
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
          <h3 className="text-lg font-semibold">Marketing Template</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name *</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., seasonal_promotion"
              disabled={!!template}
            />
            <p className="text-sm text-muted-foreground">Lowercase letters, numbers, and underscores only.</p>
          </div>

          <div className="space-y-2">
            <Label>Language</Label>
            <Input value={language} disabled />
            <p className="text-sm text-muted-foreground">Fixed to en_US for this submission.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="header-text">Header *</Label>
            <Input
              id="header-text"
              value={headerText}
              onChange={(e) => setHeaderText(e.target.value)}
            />
            <Input
              value={headerExample}
              onChange={(e) => setHeaderExample(e.target.value)}
              placeholder="Header example (e.g., Summer Sale)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body-text">Body *</Label>
            <Input
              id="body-text"
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
            />
            {bodyExamples.map((example, idx) => (
              <Input
                key={idx}
                value={example}
                onChange={(e) => {
                  const updated = [...bodyExamples];
                  updated[idx] = e.target.value;
                  setBodyExamples(updated);
                }}
                placeholder={`Body example ${idx + 1}`}
              />
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="footer-text">Footer</Label>
            <Input
              id="footer-text"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-reply1">Quick Reply (Recommended)</Label>
            <Input
              id="quick-reply1"
              value={quickReply1}
              onChange={(e) => setQuickReply1(e.target.value)}
              placeholder="e.g., Unsubscribe from Promos"
            />
            <Label htmlFor="url-button-text">URL Button Text</Label>
            <Input
              id="url-button-text"
              value={urlButtonText}
              onChange={(e) => setUrlButtonText(e.target.value)}
              placeholder="e.g., Shop Now"
            />
            <Label htmlFor="url-button-link">URL Button Link</Label>
            <Input
              id="url-button-link"
              value={urlButtonLink}
              onChange={(e) => setUrlButtonLink(e.target.value)}
              placeholder="e.g., https://example.com/shop"
            />
          </div>

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