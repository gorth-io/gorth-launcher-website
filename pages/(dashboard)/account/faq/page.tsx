import { launcherFaqQuestions } from "@/utils/constant";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@gorth/primitive/default/card";
export default function FaqPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">FAQ</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {launcherFaqQuestions.map(([title, answer]) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>{answer}</CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
