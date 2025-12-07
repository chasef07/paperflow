export const metadata = {
  title: 'PaperSend - Vercel Edge Demo',
  description: 'PDF generation on Vercel Edge Runtime',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
