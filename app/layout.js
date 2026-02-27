import './globals.css';

export const metadata = {
  title: 'Scheduler — Share Your Availability',
  description: 'Lightweight scheduling system for sharing availability and booking time.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
