import Topbar from "@/components/Topbar";
import LeadForm from "@/components/LeadForm";

export default function NewLeadPage() {
  return (
    <div>
      <Topbar
        title="New Lead"
        subtitle="Capture a lead from an in-person conversation, email reply, referral, or cold outreach. Submitting runs the Lead Capture Loop."
      />
      <div className="p-8">
        <LeadForm />
      </div>
    </div>
  );
}
