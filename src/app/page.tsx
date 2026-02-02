/**
 * Root Page - Permanent Redirect to Dashboard
 * 
 * This page serves as the entry point and permanently redirects to /dasbor.
 * Using permanentRedirect for HTTP 308 permanent redirect (better SEO).
 */
import { permanentRedirect } from "next/navigation";

export default function RootPage() {
  permanentRedirect("/dasbor");
}
