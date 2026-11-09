export const resourceConfigs = {
  terms: {
    title: "Terms",
    eyebrow: "PROMPT VOCABULARY",
    description: "Create and maintain reusable language that guides generation.",
    table: "terms",
    order: "term",
    fields: [
      { name: "term", label: "Term", required: true, maxLength: 80 },
      { name: "definition", label: "Definition", type: "textarea", required: true, maxLength: 500 },
      { name: "category", label: "Category", maxLength: 80 },
      { name: "active", label: "Active", type: "checkbox" },
    ],
  },
  examples: {
    title: "Generation examples",
    eyebrow: "REFERENCE OUTPUTS",
    description: "Curate prompt and response pairs used to evaluate generation quality.",
    table: "ai_generation_examples",
    order: "created_at",
    descending: true,
    fields: [
      { name: "title", label: "Title", required: true, maxLength: 100 },
      { name: "input_prompt", label: "Input prompt", type: "textarea", required: true, maxLength: 2000 },
      { name: "output_text", label: "Expected AI output", type: "textarea", required: true, maxLength: 4000 },
      { name: "notes", label: "Reviewer notes", type: "textarea", maxLength: 1000 },
    ],
  },
  providers: {
    title: "LLM providers",
    eyebrow: "MODEL INFRASTRUCTURE",
    description: "Manage the companies and endpoints that serve language models.",
    table: "llm_providers",
    order: "name",
    fields: [
      { name: "name", label: "Provider name", required: true, maxLength: 100 },
      { name: "base_url", label: "API base URL", type: "url", maxLength: 500 },
      { name: "active", label: "Active", type: "checkbox" },
    ],
  },
  models: {
    title: "LLM models",
    eyebrow: "MODEL REGISTRY",
    description: "Control which language models are available to generation workflows.",
    table: "llm_models",
    order: "name",
    fields: [
      { name: "name", label: "Display name", required: true, maxLength: 100 },
      { name: "model_key", label: "Provider model key", required: true, maxLength: 160 },
      { name: "provider_id", label: "Provider", type: "relation", relationTable: "llm_providers", required: true },
      { name: "active", label: "Active", type: "checkbox" },
    ],
  },
  domains: {
    title: "Allowed signup domains",
    eyebrow: "ACCESS CONTROL",
    description: "Control which email domains may create an account.",
    table: "allowed_signup_domains",
    order: "domain",
    fields: [
      { name: "domain", label: "Domain", required: true, maxLength: 255, placeholder: "columbia.edu" },
      { name: "active", label: "Active", type: "checkbox" },
    ],
  },
  emails: {
    title: "Whitelisted emails",
    eyebrow: "ACCESS EXCEPTIONS",
    description: "Manage individual addresses that may sign up regardless of domain.",
    table: "whitelisted_emails",
    order: "email",
    fields: [
      { name: "email", label: "Email address", type: "email", required: true, maxLength: 320 },
      { name: "active", label: "Active", type: "checkbox" },
    ],
  },
};

export function getResourceConfig(resource) {
  return resourceConfigs[resource] || null;
}
