import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-navy-deep">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-[2fr_1fr_1fr] lg:px-8">
        <div>
          <p className="font-headline text-3xl tracking-headline text-white">
            THE HEADS UP! FOUNDATION
          </p>
          <span className="rule-teal my-4" />
          <p className="max-w-md font-body text-sm leading-relaxed text-warmgray">
            Enriching and enhancing the lives of Dallas–Fort Worth youth through
            education, sports, and mentoring since 2003.
          </p>
          <p className="mt-6 font-quote text-lg italic text-teal">
            &ldquo;Your game is just the beginning.&rdquo;
          </p>
        </div>

        <div>
          <p className="mb-4 font-body text-xs font-bold uppercase tracking-wide2 text-white">
            Foundation
          </p>
          <ul className="space-y-2 font-body text-sm text-warmgray">
            <li><Link href="/about" className="hover:text-teal">About / Mission</Link></li>
            <li><Link href="/programs" className="hover:text-teal">Programs</Link></li>
            <li><Link href="/events" className="hover:text-teal">Events</Link></li>
            <li><Link href="/get-involved" className="hover:text-teal">Get Involved</Link></li>
            <li><Link href="/donate" className="hover:text-teal">Donate</Link></li>
          </ul>
        </div>

        <div>
          <p className="mb-4 font-body text-xs font-bold uppercase tracking-wide2 text-white">
            Network
          </p>
          <ul className="space-y-2 font-body text-sm text-warmgray">
            <li><Link href="/media" className="hover:text-teal">Media / HoopCityUSA</Link></li>
            <li><Link href="/pro-file-os" className="hover:text-teal">PRO-File OS</Link></li>
            <li><Link href="/contact" className="hover:text-teal">Contact</Link></li>
            <li><Link href="/login" className="hover:text-teal">Log In</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 font-body text-xs text-warmgray md:flex-row md:items-center md:justify-between lg:px-8">
          <p>
            &copy; {new Date().getFullYear()} The Heads Up! Foundation.{" "}
            <span className="needs-input !inline !border-0 !bg-transparent !p-0">
              [[NEEDS JABARI INPUT: 501(c)(3) EIN + tax-deductibility line]]
            </span>
          </p>
          <p>
            A community initiative of{" "}
            <span className="text-white/70">HeadsUP MEDIA &amp; Scouting</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
