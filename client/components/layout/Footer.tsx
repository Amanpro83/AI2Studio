export default function Footer() {
  return (
    <footer className="border-t mt-12">
      <div className="container py-8 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} AI2 Extension Studio</p>
        <p className="text-center sm:text-right">
          Build AI2 extensions visually with Blockly. Export production-ready
          Java.
        </p>
      </div>
    </footer>
  );
}
