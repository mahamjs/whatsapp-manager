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
  type: "BODY" | "FOOTER" | "BUTTONS";
  add_security_recommendation?: boolean;
  code_expiration_minutes?: number;
  buttons?: {
    type: "OTP";
    otp_type: "COPY_CODE" | "ZERO_TAP";
  }[];
}

interface TemplatePayload {
  name: string;
  language: string;
  category: "AUTHENTICATION";
  components: TemplateComponent[];
}

interface AuthenticationTemplateFormProps {
  template?: {
    name: string;
    language: string;
  } | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AuthenticationTemplateForm({ template, onSuccess, onCancel }: AuthenticationTemplateFormProps) {
  const { user } = useAuth();
  const [name, setName] = useState(template?.name || "");
  const [language] = useState("en_US");
  const [expirationMinutes, setExpirationMinutes] = useState(10);
  const [otpType, setOtpType] = useState<"COPY_CODE" | "ZERO_TAP">("COPY_CODE");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string>("");

  useEffect(() => {
    const generatePreview = () => {
      const body = "*{{1}}* is your verification code. For your security, do not share this code.";
      const footer = `This code expires in ${expirationMinutes} minutes.`;
      const buttonInfo = otpType === "COPY_CODE" ? "\n\nButton: Copy Code - Tap to copy the code." : "\n\nZero-Tap: Code is automatically read by your app.";
      return `${body}\n\n${footer}${buttonInfo}`;
    };
    setPreview(generatePreview());
  }, [expirationMinutes, otpType]);

  const validate = (): string | null => {
    if (!name.trim()) return "Template name is required.";
    if (!/^([a-z0-9_]{1,512})$/.test(name)) return "Template name must be lowercase, alphanumeric, and may include underscores.";
    if (expirationMinutes < 1 || expirationMinutes > 90) return "Expiration must be between 1 and 90 minutes.";
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

    const buttonsPayload: TemplateComponent = {
      type: "BUTTONS",
      buttons: [
        {
          type: "OTP",
          otp_type: otpType
        }
      ]
    };

    const payload: TemplatePayload = {
      name,
      language: language,
      category: "AUTHENTICATION",
      components: [
        {
          type: "BODY",
          add_security_recommendation: true
        },
        {
          type: "FOOTER",
          code_expiration_minutes: expirationMinutes
        },
        buttonsPayload
      ]
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
        const message = data?.error?.error?.message || data?.error || "Failed to submit authentication template.";
        throw new Error(message);
      }

      alert("Authentication template submitted successfully!");
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
          <h3 className="text-lg font-semibold">Authentication Template</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name *</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., otp_verification"
              disabled={!!template}
            />
            <p className="text-sm text-muted-foreground">Lowercase letters, numbers, and underscores only.</p>
          </div>

          <div className="space-y-2">
            <Label>Language</Label>
            <Input value={language} disabled />
            <p className="text-sm text-muted-foreground">Fixed to en_US for this submission. Body content is predefined by WhatsApp.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiration">Code Expiration (minutes) *</Label>
            <Input
              id="expiration"
              type="number"
              min={1}
              max={90}
              value={expirationMinutes}
              onChange={(e) => setExpirationMinutes(parseInt(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="otp-type">OTP Type *</Label>
            <select
              id="otp-type"
              value={otpType}
              onChange={(e) => setOtpType(e.target.value as "COPY_CODE" | "ZERO_TAP")}
              className="w-full border rounded p-2"
            >
              <option value="COPY_CODE">Copy Code - User taps to copy code</option>
              <option value="ZERO_TAP">Zero-Tap - App auto-reads code</option>
            </select>
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
