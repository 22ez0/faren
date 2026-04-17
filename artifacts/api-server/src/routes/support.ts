import { Router, type IRouter } from "express";
import { db, supportTicketsTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

router.post("/support/ticket", async (req, res): Promise<void> => {
  const { email, username, subject, message, socialNetwork } = req.body;

  if (!email || !subject || !message) {
    res.status(400).json({ error: "Preencha todos os campos obrigatórios." });
    return;
  }
  if (message.length > 2000) {
    res.status(400).json({ error: "Mensagem muito longa (máx 2000 caracteres)." });
    return;
  }

  await db.insert(supportTicketsTable).values({
    email: email.trim(),
    username: username?.trim() || null,
    subject: subject.trim(),
    message: message.trim(),
    socialNetwork: socialNetwork?.trim() || null,
  });

  res.json({ success: true });
});

export { router as supportRouter };
export default router;
