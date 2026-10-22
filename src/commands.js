
import { InlineKeyboard } from "grammy"

const HF_TOKEN = process.env.HF_TOKEN
const MODEL = "openai/gpt-oss-120b:fastest"

export function registerCommands(bot) {
  bot.command("start", (ctx) =>
    ctx.reply(
      "سلام! 🤖 من دستیار هوش مصنوعی تو هستم.\nهر سؤالی داری بپرس!",
      {
        reply_markup: new InlineKeyboard().text("راهنما", "help"),
      },
    ),
  )

  bot.command("help", (ctx) =>
    ctx.reply("فقط پیام بده تا هوش مصنوعی بهت جواب بده!\n/ping برای بررسی وضعیت بات"),
  )

  bot.command("ping", (ctx) => ctx.reply("بات فعاله! ✅"))

  bot.callbackQuery("help", async (ctx) => {
    await ctx.answerCallbackQuery()
    await ctx.reply("هر متنی بفرستی، تلاش می‌کنم با هوش مصنوعی جواب بدم.")
  })

  bot.on("message:text", async (ctx) => {
    const question = ctx.message.text

    if (question.startsWith("/")) return

    if (!HF_TOKEN) {
      await ctx.reply("توکن هوش مصنوعی هنوز تنظیم نشده.")
      return
    }

    await ctx.replyWithChatAction("typing")

    try {
      const response = await fetch(
        "https://router.huggingface.co/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${HF_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: MODEL,
            messages: [
              {
                role: "system",
                content: "تو یک دستیار دوستانه هستی. به زبان فارسی و واضح جواب بده.",
              },
              { role: "user", content: question },
            ],
            max_tokens: 400,
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        console.error("Hugging Face error:", data)
        await ctx.reply("فعلاً نتونستم جواب بگیرم؛ ممکنه مدل در دسترس نباشه یا اعتبار API کافی نباشه.")
        return
      }

      const answer = data.choices?.[0]?.message?.content
      await ctx.reply(answer || "این بار جوابی دریافت نکردم.")
    } catch (error) {
      console.error("AI request failed:", error)
      await ctx.reply("ارتباط با هوش مصنوعی برقرار نشد. کمی بعد دوباره امتحان کن.")
    }
  })
}
