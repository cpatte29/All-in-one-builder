import Link from "next/link";

export default function Hero({ headline, subhead }: { headline: string; subhead: string }) {
  return (
    <section className="border-b border-gray-200 bg-gray-50 px-4 py-16 text-center">
      <h1 className="mx-auto max-w-2xl text-3xl font-bold sm:text-4xl">{headline}</h1>
      <p className="mx-auto mt-4 max-w-xl text-gray-600">{subhead}</p>
      <Link
        href="/contact"
        className="mt-6 inline-block rounded-md bg-brand-primary px-6 py-3 font-medium text-white"
      >
        Request an Appointment
      </Link>
    </section>
  );
}
