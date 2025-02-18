import { RazorpayProvider } from "@/providers/RazorpayProvider";
import { UserMenu } from "@/components/user-menu/UserMenu";

function App() {
  return (
    <RazorpayProvider>
      <UserMenu userEmail={undefined} />
    </RazorpayProvider>
  );
}

export default App;
