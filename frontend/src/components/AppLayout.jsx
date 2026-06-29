import Navbar from "./Navbar";
import Footer from "./Footer";
import ChatBox from "./ChatBox";

export default function AppLayout({ children }) {
  return (
    <>
      <Navbar />
      <div className="app-shell">
        <div className="page-content">{children}</div>
        <Footer />
      </div>
      <ChatBox />
    </>
  );
}