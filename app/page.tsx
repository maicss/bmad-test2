import { redirect } from "next/navigation";

export default function Home() {
  // 默认跳转到家庭登录页
  redirect("/family/login");
}
