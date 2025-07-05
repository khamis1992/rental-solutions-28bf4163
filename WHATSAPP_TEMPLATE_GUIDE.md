# 🔧 WhatsApp Message Template Guide (Error 63016 Fix)

## Problem: Twilio Error 63016
You are seeing this error: `Failed to send freeform message because you are outside the allowed window. If you are using WhatsApp, please use a Message Template.`

As explained in the [Twilio documentation](https://www.twilio.com/docs/api/errors/63016), this happens because of a WhatsApp policy:
- If a customer messages you, you have **24 hours** to reply with a "freeform" message (any text).
- To **start a new conversation** or reply after 24 hours, you **must** use a pre-approved Message Template.

Our payment reminders are business-initiated, so they require a template.

## Solution: Create and Use WhatsApp Message Templates

We need to create templates in your Twilio Console and then update our code to use them.

### Step 1: Create a "Payment Reminder" Template

Please follow these instructions exactly:

1.  **Go to your Twilio Console:**
    *   Navigate to **Messaging -> Senders -> WhatsApp Templates**.
    *   [Direct Link](https://console.twilio.com/us1/develop/messaging/senders/whatsapp-templates)

2.  **Create a New Template:**
    *   Click the **"Create new template"** or **"New message template"** button.

3.  **Fill in the Template Details:**
    *   **Template name:** `payment_reminder`
    *   **Category:** `Utility`
    *   **Language(s):** Select `Arabic (ar)`

4.  **Enter the Message Body:**
    *   Copy and paste the following text **exactly** into the "Body" text box:
    ```
    *تذكير دفعة - شركة العراف للتأجير*

    السلام عليكم {{1}},

    نذكركم بأن دفعة بقيمة *{{2}} ريال قطري* مستحقة بتاريخ *{{3}}* لعقد {{4}}.

    يرجى المبادرة بالسداد لتجنب أي رسوم إضافية.

    شكراً لكم,
    *شركة العراف للتأجير*
    ```
    *   **What are `{{1}}`, `{{2}}`?** These are variables that our code will replace with the customer's name, payment amount, etc.

5.  **Submit for Approval:**
    *   Click **"Submit message template"**.
    *   Approval is usually fast (a few minutes to an hour). You will see the status change from "Pending" to "Approved".

### Step 2: Get the Approved Template SID

Once the template is **"Approved"**:
1.  Click on the template name (`payment_reminder`).
2.  Copy the **Template SID**. It will start with `HX...`.

### Step 3: Provide the SID to me

Please paste the approved **Template SID** here in the chat.

---

## What's Next?

Once you provide the Template SID, I will:
1.  Update the `send-whatsapp` Edge Function to use this template.
2.  Modify the code to send the dynamic data (name, amount) as variables.
3.  Repeat this process for other messages like "Overdue Payment Alerts".

This will resolve the error permanently and align our application with WhatsApp's official policies. 