# Veritek Field Service Management Platform — User Guide

**Version 2.0 · For Dispatchers, Administrators, and Field Engineers**

---

## Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [Setting Up Your Data](#3-setting-up-your-data)
   - 3.1 [Adding Sites](#31-adding-sites)
   - 3.2 [Adding Users (Engineers and Dispatchers)](#32-adding-users-engineers-and-dispatchers)
4. [The Back Office Web Portal](#4-the-back-office-web-portal)
   - 4.1 [Dashboard](#41-dashboard)
   - 4.2 [Service Orders](#42-service-orders)
   - 4.3 [Dispatch Board](#43-dispatch-board)
   - 4.4 [Engineers](#44-engineers)
   - 4.5 [Materials](#45-materials)
   - 4.6 [Sites](#46-sites)
   - 4.7 [Reports](#47-reports)
   - 4.8 [Webhooks](#48-webhooks-technical)
   - 4.9 [API Keys](#49-api-keys-technical)
5. [The Mobile App (Field Engineers)](#5-the-mobile-app-field-engineers)
   - 5.1 [Installing the App](#51-installing-the-app)
   - 5.2 [Signing In](#52-signing-in)
   - 5.3 [Clocking In and Out](#53-clocking-in-and-out)
   - 5.4 [Work List](#54-work-list)
   - 5.5 [Accepting and Rejecting Jobs](#55-accepting-and-rejecting-jobs)
   - 5.6 [Working a Job — Step by Step](#56-working-a-job--step-by-step)
   - 5.7 [Photo Attachments](#57-photo-attachments)
   - 5.8 [Inventory (Van Stock)](#58-inventory-van-stock)
   - 5.9 [Private Activities](#59-private-activities)
   - 5.10 [Shipping and Parts Returns](#510-shipping-and-parts-returns)
   - 5.11 [Job History](#511-job-history)
6. [Day-to-Day Workflows](#6-day-to-day-workflows)
   - 6.1 [Creating and Dispatching a Job](#61-creating-and-dispatching-a-job)
   - 6.2 [A Field Engineer's Full Day](#62-a-field-engineers-full-day)
   - 6.3 [Managing Parts and Returns](#63-managing-parts-and-returns)
   - 6.4 [Monitoring SLA Performance](#64-monitoring-sla-performance)
7. [Understanding Job Statuses](#7-understanding-job-statuses)
8. [Understanding Priority Levels](#8-understanding-priority-levels)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Introduction

The Veritek Field Service Management Platform is a purpose-built system for managing field engineers across the UK. It replaces the Astea platform and consists of two main parts:

- **The Back Office Web Portal** — used by dispatchers, operations staff, and administrators. Accessible from any web browser.
- **The Mobile App** — used by field engineers on their phones (iOS and Android). Used on-site to receive jobs, record work, capture photo evidence, and collect customer sign-off.

The two systems are always in sync. When a dispatcher assigns a job in the portal, it appears on the engineer's phone within seconds. When an engineer completes a job, the portal updates immediately.

---

## 2. Getting Started

### Accessing the Web Portal

Open a web browser and go to your Veritek portal URL (provided by your system administrator). Sign in with the email address and password you received in your invitation email.

If this is your first time logging in, click the link in the invitation email to set your password before signing in.

### Roles Explained

There are three types of users in the system:

| Role | What they can do |
|---|---|
| **Engineer** | Use the mobile app to receive and complete jobs |
| **Dispatcher** | Full access to the web portal — create jobs, assign engineers, monitor progress |
| **Admin** | Everything a Dispatcher can do, plus manage users and access settings |

---

## 3. Setting Up Your Data

Before the system can be used operationally, you need to add your sites and your team. Do this before creating any service orders.

### 3.1 Adding Sites

A **site** is a customer location where work is carried out. Every service order must be linked to a site.

**To add a site:**

1. Sign in to the web portal as a Dispatcher or Admin.
2. Click **Sites** in the left-hand sidebar.
3. Click the **+ Add Site** button in the top right.
4. Fill in the form:
   - **Site Name** *(required)* — the customer's location name, e.g. "Manchester Depot" or "Tesco Warrington Distribution Centre"
   - **Address** *(optional but recommended)* — the full street address
   - **Postcode** *(optional but recommended)* — the UK postcode, e.g. "WA1 1AA"
5. Click **Add Site**.

The site will now appear in the sites list and will be available to select when creating a service order.

**To edit a site:**

1. Go to **Sites** in the sidebar.
2. Find the site in the list and click **Edit** on the right.
3. Make your changes and click **Save Changes**.

> **Tip:** Add all your regular customer sites before going live. Engineers see the site name, address, and postcode in the mobile app when they receive a job, so keeping this up to date helps them navigate correctly.

---

### 3.2 Adding Users (Engineers and Dispatchers)

New users are added by an Admin from the **Engineers** section of the portal. When you add a user, the system automatically sends them an invitation email with a link to set their password.

**To add a new engineer or dispatcher:**

1. Click **Engineers** in the left-hand sidebar.
2. Click **+ New Engineer** (or the equivalent new user button at the top right).
3. Fill in the invitation form:
   - **First Name** and **Last Name**
   - **Email Address** — this is what they will use to sign in
   - **Role** — choose Engineer, Dispatcher, or Admin
   - **Warehouse** *(optional)* — assign the engineer to a warehouse location if relevant
4. Click **Create**.

The new user will receive an email inviting them to set their password. They can then sign in to the web portal (dispatchers/admins) or the mobile app (engineers).

**Important:** The invitation email is sent once. If the user misses it or the link expires, contact your system administrator to re-send the invitation.

**To deactivate a user:**

If someone leaves the business or should no longer have access:

1. Go to **Engineers** in the sidebar.
2. Click the engineer's name.
3. Scroll to the **Danger Zone** section at the bottom.
4. Click **Deactivate [Name]**.

This immediately removes their access. The action cannot be undone from the portal.

---

## 4. The Back Office Web Portal

### 4.1 Dashboard

The Dashboard is the first screen you see after signing in. It gives you a live overview of your field operations.

**The four headline numbers at the top are:**

| Card | What it means |
|---|---|
| **Open Orders** | Total jobs that have not been completed or closed |
| **In Progress** | Jobs currently being worked on by an engineer |
| **SLA At Risk** | Jobs that have been open for more than 4 hours without resolution |
| **Engineers Clocked In** | How many engineers have clocked in for today's shift |

Click any of these numbers to jump straight to the relevant filtered list.

**Status Breakdown** shows how many orders are in each state (Received, Accepted, In Progress), giving you a quick picture of the queue.

**Priority Distribution** shows how jobs are spread across your four priority levels so you can see if urgent work is accumulating.

**Recent Completions** lists the most recently finished jobs.

---

### 4.2 Service Orders

Service orders are the core of the system — every piece of work done by a field engineer is a service order.

#### Viewing the List

Click **Service Orders** in the sidebar. You'll see a table of all orders with:
- **Reference** — a unique ID for each order (click to open it)
- **SV Number** — the external system reference (e.g. from Astea or your CRM), if set
- **Site** — the customer location
- **Priority** — colour-coded from Critical (red) to Low (green)
- **Status** — where the job is in its lifecycle
- **Engineer** — who it's assigned to (or blank if unassigned)
- **Due** — the customer due date, if set
- **Created** — when the order was raised

Use the **filter bar** at the top to search by reference number, SV number, or description, and to filter by status, priority, or engineer.

#### Creating a New Service Order

1. Click the **+ New Order** button.
2. Fill in the form:
   - **Site** *(required)* — select the customer location from the dropdown.
   - **Short Description** *(optional)* — a brief one-line summary of the fault, e.g. "Chiller unit not cooling". This appears as the headline on the engineer's mobile app.
   - **Problem Description** *(optional)* — a more detailed description of the reported fault, background information, or special instructions for the engineer.
   - **Priority** *(required)* — see [Understanding Priority Levels](#8-understanding-priority-levels) below.
   - **SV Number** *(optional)* — if the job originates from an external system (such as Astea or a CRM), enter the reference number here so the two records can be linked.
   - **Contact Name** *(optional)* — the name of the on-site contact person the engineer should ask for.
   - **Contact Phone** *(optional)* — a direct number for the on-site contact.
   - **Customer Due Date** *(optional)* — the SLA deadline agreed with the customer.
   - **Assign Engineer** *(optional)* — if you already know which engineer should attend, select them here.
   - **ETA** *(optional)* — if the customer has been given an estimated arrival time, enter it here. The engineer will see this in the mobile app.
3. Click **Create Service Order**.

You will be taken straight to the order's detail page where you can monitor its progress.

#### The Service Order Detail Page

This page is your central view of a single job. It shows:

**Order Summary** — reference, SV number, site, priority, status, short description, problem description, contact details, customer due date, assigned engineer, and ETA.

**Assign Engineer** — if the order is unassigned or you need to reassign it, use the dropdown to select a different engineer and optionally update the ETA. Click **Assign** to save.

**Close Order** — if a job is stuck and needs to be resolved without the standard engineer sign-off process, click the red **Close Order** button. Use with care — this cannot be undone.

**Activities** — a log of all time blocks recorded by the engineer against this job. Each activity shows:
- Type of work (Break Fix, Preventive Maintenance, Installation)
- Travel start time and work start time
- Work end time and stop code
- Miles travelled

**Materials** — all parts associated with this order. For each part you can see:
- Product name and SKU
- Quantity ordered and **quantity fitted on site**
- Whether the part is **consignment stock** (customer-owned)
- **Serial number** of the fitted part, if applicable
- Current status (Needed, Allocated, Fulfilled, etc.)

**Equipment** — items of equipment recorded against this order, including serial numbers.

**Attachments** — photos uploaded by the engineer from the site. Click any thumbnail to view the full-size image. Photos are stored permanently against the order.

**Resolution** — once the engineer completes the job, the resolution section shows:
- Problem Code and description
- Cause Code and description
- Repair Code and description
- Resolve Code and description
- Resolution text (the engineer's written description of what was done)
- Whether the fault was fully resolved

**Customer Sign-Off** — the drawn signature captured from the customer on-site, and the printed name of the person who signed. Both are stored permanently and cannot be altered after submission.

---

### 4.3 Dispatch Board

The Dispatch Board gives dispatchers a split-screen view to quickly assign work.

**Left side — Unassigned Orders:** All service orders that have no engineer assigned. Each shows the priority, reference, site, and when it was created. Click **Assign** on any card to go to that order's detail page and assign an engineer.

**Right side — Engineer Roster:** All engineers and their current status. A green dot means the engineer is clocked in and available. If they're on a job, it shows the job reference. Use this alongside the unassigned orders to make decisions.

> **Tip:** Use the Dispatch Board at the start of each day and periodically throughout the day to ensure no jobs are sitting unassigned.

---

### 4.4 Users

The Users section shows your full team across all roles. The list view shows each user's name, email address, role (Engineer, Dispatcher, or Admin), clock status, and current active job where applicable. Click a name to open their profile, which shows clock status, current job, van stock item count, and today's full clock event history. To add a new team member, click **Invite User** — enter their name, email, and role, and they will receive an email with a link to set their password and activate their account.

**The detail page** shows:
- Clock status (in or out)
- Current job (if on one)
- Van stock item count
- Today's full clock event history (every clock in and clock out with times)

**Danger Zone:** At the bottom of each user's page is the option to deactivate their account. Use this when someone leaves the business.

---

### 4.5 Materials

The Materials section gives you a cross-order view of all parts in the system, so you can track what's been ordered, what's outstanding, and what needs to be returned.

**Filter by status** using the chips at the top:
- **All** — every part across all orders
- **Needed** — parts required but not yet allocated
- **Allocated** — parts reserved for a job
- **Back-Ordered** — parts that couldn't be fulfilled from current stock
- **Fulfilled** — parts that have been fitted or delivered
- **Not Used** — parts that were allocated but not needed
- **Cancelled** — parts removed from an order

Parts are grouped by service order. Each group shows the order reference (click to open the order), the site, the engineer, and the order status.

For each part line you can see the quantity fitted on site, the serial number (for serialised parts), and whether the part is consignment stock.

A **"Parts outstanding"** badge appears on any order that has parts in a back-ordered state.

---

### 4.6 Sites

Covered in [Section 3.1](#31-adding-sites) above. The Sites page lets you view, add, and edit all customer locations.

---

### 4.7 Reports

The Reports section provides performance analytics.

**Selecting a period:**

Choose from:
- **Last 7 days**
- **Last 30 days**
- **Last 90 days**

The three KPI cards update to reflect the chosen period:
- **Jobs Completed** — total orders closed as completed
- **SLA Met %** — percentage of completed orders resolved within the 4-hour target
- **Unique Parts Used** — number of distinct part types fitted

**The three report tabs:**

**Completed Jobs**
- A bar chart showing how many jobs were completed each day
- A table listing every completed order with its reference, site, engineer, completion time, and SLA status
- Click **Download CSV** to export

**SLA Performance**
- A circular gauge showing overall SLA compliance
- A breakdown of orders within SLA vs. breached
- A table of every breach with details for investigation
- Click **Download CSV** to export breach data

**Parts Usage**
- A ranked list of every part type fitted during the period, sorted by quantity
- Useful for purchasing decisions and van stock planning
- Click **Download CSV** to export

**Printing / Saving as PDF:**
Click **Print / Save PDF** to open your browser's print dialog. Choose "Save as PDF" from the printer destination. The printed version hides navigation and shows all three tabs in full.

---

### 4.8 Webhooks *(Technical)*

Webhooks allow you to automatically notify an external system (CRM, ERP, reporting tool) whenever something happens in Veritek — for example, when a job is completed or a part is fitted.

**Creating a webhook:**

1. Go to **Webhooks** and click **+ New Webhook**.
2. Give it a **Name** to identify it, e.g. "Salesforce sync".
3. Enter the **Endpoint URL** — the address your external system provides to receive notifications.
4. Tick the **Event Types** you want to receive. Examples:
   - `job.assigned` — fires when a job is assigned to an engineer
   - `job.accepted` — fires when an engineer accepts a job
   - `job.rejected` — fires when an engineer rejects a job (includes the rejection code)
   - `job.completed` — fires when an engineer completes a job
   - `part.fitted` — fires when a part is recorded as fitted
5. Click **Create Webhook**.

**Monitoring deliveries:**

Click any webhook to see its delivery log — every event sent, whether it was delivered, and how many attempts were made. If a delivery failed, click **Retry** to try again. The system automatically retries failed deliveries up to five times with increasing delays (30 seconds → 2 minutes → 10 minutes → 1 hour → 4 hours).

**Editing or pausing a webhook:**

Open the webhook and use the settings form to change the endpoint URL, toggle it Active/Inactive, or update the event types.

> **Note:** Webhook payloads are signed with a unique HMAC-SHA256 secret. Your integration partner can verify that requests genuinely came from Veritek using the `X-Veritek-Signature` header. Contact your system administrator for the signing key.

---

### 4.9 API Keys *(Technical)*

API keys allow external software to read and write data in Veritek programmatically, without using the web portal. This is typically used by developers integrating a third-party system.

**Issuing a new key:**

1. Go to **API Keys** and click **+ Issue Key**.
2. Give the key a descriptive name (e.g. "Power BI reporting").
3. Tick only the **Scopes** the integration requires. For read-only reporting, tick only the `:read` scopes. For a system that creates orders, add the `:write` scopes too. Grant only the minimum permissions needed.
4. Optionally set an **Expiry Date** — the key will automatically stop working after this date.
5. Click **Issue Key**.

**Important:** The key value is shown **once only** after creation. Copy it immediately and store it securely. It cannot be retrieved again.

**Managing existing keys:**

- **Suspend** — temporarily disables a key without deleting it.
- **Activate** — re-enables a suspended key.
- **Revoke** — permanently deletes the key. The integration using this key will immediately stop working.

---

## 5. The Mobile App (Field Engineers)

### 5.1 Installing the App

The Veritek app is distributed via your company's standard mobile device management (MDM) system, or directly from the App Store (iOS) / Google Play (Android). Contact your administrator for the download link or installation instructions.

### 5.2 Signing In

When you first open the app, you will see the Veritek sign-in screen.

1. Enter the **email address** your administrator registered you with.
2. Enter your **password** (set when you clicked the invitation link in your welcome email).
3. Tap **Sign In**.

You will stay signed in between sessions — you won't need to sign in again unless you explicitly sign out or your session expires.

If you can't remember your password, tap **Forgot password** on the sign-in screen and follow the instructions emailed to you.

---

### 5.3 Clocking In and Out

**You must clock in before you can start work on any job.**

To clock in:

1. From any screen, tap the **clock icon** in the header (top right).
2. The Clock screen shows your current status — "Not Clocked In" or "Currently Clocked In".
3. Tap the **green Clock In** button.
4. Confirm the action when prompted.

To clock out at the end of your shift:

1. Tap the clock icon again.
2. Tap the **red Clock Out** button.
3. Confirm when prompted.

Your clock events are visible to your dispatcher in the back office portal.

---

### 5.4 Work List

The **Work List** (the first tab at the bottom of the screen) shows all your currently active jobs.

Each job card shows:
- The **order reference** (e.g. "VT-00142")
- The **SV number** (external reference), if set
- The **site name** (customer location) and address
- The **short description** of the fault or work required
- The **priority** — colour-coded label (Critical, High, Medium, Low)
- The **customer due date**, if set
- The current **status** of the job

Tap any job card to open it and start working.

Tapping into a job shows the full detail screen, including:
- Contact name and phone number for the on-site contact
- Full problem description
- All activities, materials, equipment, and attachments

If you have no active jobs, the Work List will show "No active jobs". Check with your dispatcher.

At the bottom of the Work List is a link to **View job history**.

---

### 5.5 Accepting and Rejecting Jobs

When a dispatcher assigns a new job to you, it appears in your Work List with a status of **Received**.

Open the job and read the full details — site, description, contact name, and any notes from the dispatcher — before deciding.

**To accept the job:**
Tap the green **Accept** button. The status changes to "Accepted".

**To reject the job:**
Tap the red **Reject** button. You will be shown a grid of **rejection codes** — select the one that best describes why you cannot take the job:

| Code | Reason |
|---|---|
| **NOAC** | No access to site |
| **WRNG** | Wrong engineer assigned |
| **DUPL** | Duplicate job |
| **PART** | Parts not available |
| **CAPA** | Insufficient capacity today |

Tap the appropriate code and confirm. Your dispatcher will see the rejection code immediately and can reassign the job.

> **Note:** You must select a rejection code — free-text reasons are not accepted. This ensures rejections are properly tracked and reported.

---

### 5.6 Working a Job — Step by Step

Once you've accepted a job, here is the complete process from travel to sign-off.

#### Step 1 — Start Travelling

1. Open the job from your Work List.
2. Go to the **Activities** tab.
3. If no activity exists yet, tap **+ New Activity** and choose the type of work:
   - **Break Fix** — fault repair
   - **Preventive Maintenance** — scheduled service
   - **Installation** — new equipment being installed
4. Your new activity will appear with a status of **Open**.
5. Tap **Start Travel**.

The app records your travel start time.

#### Step 2 — Arrive and Start Work

1. When you arrive on site, open the job and go to **Activities**.
2. Tap **Start Work**.
3. Enter the **miles travelled** to reach the site and confirm.

The app records your work start time and updates the order to **In Progress**.

#### Step 3 — Complete the Checklist

Before stopping work, you must complete the equipment checklist.

1. Tap the **Checklist** button in the Activities tab.
2. Answer each question — tap **Pass**, **Fail**, or **N/A** for each one.
3. Tap **Submit Checklist** when all questions are answered.

> **Important:** You cannot stop work until all checklist questions are answered. The app will block the Stop Work action and tell you how many questions remain. If there are no questions for the equipment type, the checklist screen will say so and you can proceed.

#### Step 4 — Stop Work and Select a Stop Code

1. Back in the Activities tab, tap **Stop Work** (the red button).
2. Select a **Stop Code** — this categorises the outcome of the visit. Tap the appropriate code from the grid (e.g. COMP — Completed, PART — Parts required).
3. Optionally enter **Comments** about the work, anything that couldn't be done, or notes for the record.
4. Tap **Stop Work**.

#### Step 5 — Record the Resolution

After stopping work, you'll be taken to the **Resolution** screen. This captures a structured record of what was found and what was done — this data feeds into your reports and can be sent to your customer's systems.

Fill in all four code fields by tapping each one and selecting from the list:

- **Problem Code** — the category of fault (e.g. MECH — Mechanical, ELEC — Electrical)
- **Cause Code** — what specifically caused the problem (e.g. COMP — Component failure, WEAR — Normal wear)
- **Repair Code** — what action was taken (e.g. REPL — Part replaced, SERV — Service carried out, ADJU — Adjustment made)
- **Resolve Code** — the outcome (e.g. FULL — Fully resolved, PART — Partially resolved, RETN — Return visit required)

Then fill in:
- **Resolution Text** — write a brief description of what you found and what you did, in your own words. This appears on the completed job record.
- **Fully Resolved** — toggle this on if the fault has been completely fixed, or leave it off if a follow-up visit will be needed.

Tap **Continue to Signature →** when complete. All four code fields are required.

#### Step 6 — Collect Customer Sign-Off

You'll be taken to the **Signature** screen.

1. Ask the customer for their **printed name** and type it into the "Customer name" field at the top.
2. Hand the device to the customer.
3. Ask them to **draw their signature** on the white pad using their finger. They simply sign as they would on paper.
4. If they make a mistake, tap **Clear signature** to start again.
5. Once the customer is happy with both the name and signature, take the device back and tap **Complete Job**.

The job is now marked as **Completed** and disappears from your active Work List. The dispatcher can see the completion in real time. The drawn signature and printed name are stored permanently against the job record and are visible in the back office portal.

---

### 5.7 Photo Attachments

You can attach photos to a service order at any point while it is in progress — for example, to document the fault before repair, the completed work, or any equipment labels.

**To add a photo:**

1. Open the job.
2. Go to the **Attachments** tab.
3. Tap **Take Photo**.
4. If prompted, allow the app to access your camera.
5. Point the camera and tap the shutter button to capture.
6. The photo is automatically uploaded and appears in the grid on the Attachments tab.

You can add as many photos as needed. All photos are stored permanently against the job and are visible to dispatchers and administrators in the back office portal.

> **Note:** Photos are uploaded in the background. If you're in an area with no signal, the upload will be queued and sent automatically when you reconnect — just like all other actions in the app.

---

### 5.8 Inventory (Van Stock)

The **Inventory** tab (second tab at the bottom) shows everything currently loaded on your van.

- Browse the full list, or use the **search bar** to find a part by name or SKU.
- Each item shows the **product name**, **SKU code**, and your current **quantity**:
  - Green quantity = good stock (more than 2)
  - Amber quantity = low stock (1–2)
  - Red quantity = zero stock
- Pull down on the list to refresh it.

Use this tab before attending a job to confirm you have the required parts, or when taking stock of what's on your van.

> **Note:** Van stock quantities are managed by your warehouse team. Contact your dispatcher if you need stock replenished.

---

### 5.9 Private Activities

The **Private Activity** tab (third tab) lets you log time that isn't tied to a specific job — for example, travelling back to the depot, attending training, or recording a planned absence.

**Logging a time block:**

1. Tap the **+ button** (bottom right).
2. Choose the activity type: **Travel**, **Training**, **Holiday**, **Absence**, or **Other**.
3. Enter a **Subject** (required) — a brief description, e.g. "Return to depot", "First Aid training — Sheffield".
4. Optionally enter a **Location** — the place where the activity is taking place, e.g. "Sheffield Training Centre".
5. Tap **Start**.

The subject and location are visible to your dispatcher and management in the portal, so they understand how your time is being spent when you're not on a job.

**Marking a time block as done:**

When the activity ends, find it in the list and tap the **Done** button. This records the end time.

**Removing a time block:**

If you created one by mistake, tap the **X** button on the card and confirm removal.

---

### 5.10 Shipping and Parts Returns

The **Shipping** tab (fourth tab) shows any parts return requests or on-site collection requests associated with your jobs.

**Types of shipping:**

- **Parts Return** — parts that need to be sent back to the warehouse (unused, damaged, or DOA).
- **On-Site Collection** — parts that are being collected from a site rather than the warehouse.

**Each shipment card shows:**
- The type (Return or Collection)
- The date it was created and how many part lines are included
- The first three parts listed (e.g. "Capacitor 40µF × 2") and a "+X more" indicator for additional items
- The current status: **Pending**, **Collected**, or **Cancelled**

**Confirming a collection:**

When you have physically picked up or handed back the parts:

1. Find the shipment in the list.
2. Tap **Mark Collected**.
3. Confirm the action.

The status updates to Collected, and the warehouse team can see this in the portal.

**Cancelling a shipment:**

If a collection is no longer needed, tap **Cancel** and confirm.

---

### 5.11 Job History

Tap **View job history** at the bottom of the Work List to open the History screen.

Use the **search bar** to find any past job by order reference, SV number, or site name. Results appear as you type. Tap any result to view the full job record including all activities, materials, equipment, photo attachments, the resolution record, and the customer's drawn signature.

---

## 6. Day-to-Day Workflows

### 6.1 Creating and Dispatching a Job

**Who does this:** Dispatcher or Admin

1. **Receive the job** — from a customer call, email, or automatic trigger from an external system.
2. **Create the service order:**
   - Go to **Service Orders → + New Order**
   - Select the site, enter a short description and problem description, choose the priority
   - Enter the SV number if linking to an external system
   - Add contact name, contact phone, and customer due date if known
   - Assign an engineer if you know who should attend
3. **Monitor for acceptance** — the engineer will receive the job on their mobile app. Watch for the status to change from **Received** to **Accepted**.
4. **Reassign if rejected** — if the engineer rejects the job, you'll see their rejection code (e.g. "No access to site" or "Wrong engineer"). Reassign to another engineer via the order's detail page.
5. **Track progress** — watch the status move from **Accepted → In Progress → Completed**.

---

### 6.2 A Field Engineer's Full Day

| Time | Action |
|---|---|
| Start of shift | Open the app, tap the clock icon, tap **Clock In** |
| Job received | Job appears in Work List with status "Received" |
| Review job | Open it, read the description, site details, contact name |
| Accept or reject | Tap **Accept**, or tap **Reject** and select a rejection code |
| Drive to site | In Activities tab, create an activity if needed, tap **Start Travel** |
| Arrive | Tap **Start Work**, enter miles travelled |
| Work on site | Carry out the repair or service |
| Take photos | Go to Attachments tab, tap **Take Photo** to document the work |
| Complete checklist | Tap **Checklist** in Activities, answer all questions |
| Stop work | Tap **Stop Work**, select stop code, add comments |
| Record resolution | Select Problem, Cause, Repair, and Resolve codes; write resolution text; set Fully Resolved |
| Customer sign-off | Enter customer's printed name; hand device for drawn signature; tap **Complete Job** |
| Multiple jobs | Repeat for each job in Work List |
| End of shift | Tap the clock icon, tap **Clock Out** |

---

### 6.3 Managing Parts and Returns

**Who does this:** Dispatcher, warehouse team, and engineers

1. **Dispatcher creates a service order** with a description indicating what parts are likely needed.
2. **Warehouse team allocates parts** to the order — the statuses in the Materials section reflect what the warehouse updates.
3. **Engineer records parts fitted on site** in the Materials section of the job:
   - Enter the **quantity fitted**.
   - For serialised parts, enter the **serial number** of the unit fitted.
   - Consignment stock (customer-owned parts) is flagged separately.
4. **Parts not used** appear with a "Not Used" status in the Materials section.
5. **Returnable parts** appear in the engineer's **Shipping** tab as a parts return request.
6. **Engineer confirms the return** by tapping **Mark Collected** when they hand the parts in.
7. **Dispatcher monitors** outstanding returns via the Materials section.

---

### 6.4 Monitoring SLA Performance

The system enforces a **4-hour SLA** — every open service order should be resolved within 4 hours of creation.

**Real-time monitoring:**
- The **Dashboard** shows the **SLA At Risk** count. This goes red when orders are approaching or past the 4-hour mark.
- Click the SLA At Risk card to see the filtered list of at-risk orders.

**Automated alerts:**
- The system automatically sends a push notification to all dispatchers and admins when a job breaches the 4-hour mark.

**Historical reporting:**
- Go to **Reports**, choose a period, and open the **SLA Performance** tab.
- The circular gauge shows your overall compliance rate.
- Use **Download CSV** to export breach data for management reporting.

---

## 7. Understanding Job Statuses

Jobs move through a defined lifecycle. Here's what each status means:

| Status | Meaning |
|---|---|
| **Received** | The job has been assigned to an engineer but the engineer hasn't accepted it yet |
| **Accepted** | The engineer has confirmed they'll attend the job |
| **In Progress** | The engineer has arrived and is actively working |
| **Completed** | The engineer has finished the work, recorded resolution codes, and collected the customer's drawn signature |
| **Closed** | The job was closed by a dispatcher via the portal without engineer sign-off |

Jobs move forward through these statuses automatically as the engineer progresses through the steps in the mobile app. They can only be force-closed by a dispatcher via the portal.

---

## 8. Understanding Priority Levels

When creating a service order, you select a priority level. This determines how urgently the job should be attended.

| Priority | Label | Colour | Typical Response Expectation |
|---|---|---|---|
| **Critical** | CRITICAL | Red | Immediate response — customer operations severely impacted |
| **High** | HIGH | Orange | Same-day response expected |
| **Medium** | MEDIUM | Amber | Response within the working day or next day |
| **Low** | LOW | Green | Scheduled response within the week |

Priority is visible to engineers in the mobile app (displayed as a coloured badge) and shown on all portal list views so dispatch staff can triage their queue effectively.

---

## 9. Troubleshooting

**"I can't log in to the mobile app"**
- Check your email and password are correct.
- If you've forgotten your password, tap **Forgot password** on the sign-in screen.
- If you never received an invitation email, ask your administrator to check the email address they registered you with.
- If your account has been deactivated, contact your administrator.

**"A job isn't appearing on my Work List"**
- Make sure you're connected to the internet (mobile data or Wi-Fi).
- Pull down on the Work List to refresh.
- Check with your dispatcher that the job has actually been assigned to you.

**"The app is not syncing my updates"**
- Check your internet connection. If you're in an area with no signal, the app will queue your actions and send them automatically when you reconnect — **your progress will not be lost**.
- Once you regain signal, pull down to refresh any screen.

**"I accidentally clocked out"**
- Contact your dispatcher. They can see your full clock event history in the portal.

**"A service order is stuck and can't be moved forward"**
- A dispatcher can force-close the order via the portal using the **Close Order** button on the order detail page.

**"The app won't let me stop work"**
- Check the Checklist tab — all questions must be answered before stopping work. The app will show how many questions remain.

**"I can't complete the job"**
- Ensure all activities on the order are in a completed state before tapping Complete Job on the signature screen.
- Ensure you have filled in all four resolution codes and the resolution text on the Resolution screen.
- Ensure the customer's printed name has been entered and a signature has been drawn.

**"A photo didn't upload"**
- If you were in an area with no signal when you took the photo, it will be queued and uploaded automatically when you reconnect. Check the Attachments tab after reconnecting.

**"I can't see the SLA at risk count or push notifications aren't arriving"**
- Ensure notifications are enabled for the Veritek app in your phone's Settings.
- Check that you are assigned the **Dispatcher** or **Admin** role — SLA push notifications are only sent to those roles.

**"A webhook is showing as failed"**
- Open the webhook in the portal and check the Delivery Log.
- Click **Retry** on failed deliveries to attempt re-delivery.
- The system retries automatically up to 5 times. If failures continue, check with your integration partner that their endpoint URL is correct and accessible.

**"An API key has stopped working"**
- Check the key is not Suspended or Revoked in the API Keys page.
- Check if the key has an expiry date that has passed.
- If the key was revoked, a new one must be issued — revoked keys cannot be recovered.

---

*For technical issues not covered here, contact your system administrator. For platform bugs or feature requests, raise an issue with the development team.*
