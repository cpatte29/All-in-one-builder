export default function ClickToCall({ phone }: { phone: string }) {
  return (
    <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="font-medium text-brand-primary">
      {phone}
    </a>
  );
}
