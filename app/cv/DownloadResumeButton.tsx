import { Download } from "lucide-react";

export function DownloadResumeButton({ href }: { href: string }) {
  return (
    <a
      className="resume-download"
      href={href}
      download="resume.pdf"
      title="Download résumé PDF"
    >
      <Download size={16} strokeWidth={2} />
      <span>Download résumé</span>
    </a>
  );
}
