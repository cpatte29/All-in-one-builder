import Topbar from "@/components/Topbar";
import IntakeForm from "@/components/IntakeForm";

export default function NewClientIntakePage() {
  return (
    <div>
      <Topbar
        title="New Client Intake"
        subtitle="Submitting this form runs the Client Profile Loop and creates the client record."
      />
      <div className="p-8">
        <IntakeForm />
      </div>
    </div>
  );
}
