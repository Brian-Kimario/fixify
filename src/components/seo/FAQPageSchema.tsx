export function FAQPageSchema() {
  const faqs = [
    {
      question: "Do I need to know which service I need?",
      answer: "No. You can describe the problem in your own words first. Fixify can help structure the request before a service category is confirmed.",
    },
    {
      question: "What happens when inspection finds extra work?",
      answer: "The additional scope should be shown clearly before extra work is approved where approval is required. The customer should be able to review what changed and why.",
    },
    {
      question: "Where can I see the current job state?",
      answer: "Open the active booking in your customer workspace. The job timeline is intended to make the current state and the next customer action visible.",
    },
    {
      question: "Can I ask for help about a specific job?",
      answer: "Yes. Use support from the relevant job when possible so the conversation can carry the request, property and job context.",
    },
    {
      question: "How does the property record work?",
      answer: "Completed work can become part of the property's maintenance history, helping you understand what was serviced, repaired or replaced over time.",
    },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      suppressHydrationWarning
    />
  );
}
