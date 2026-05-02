export type ToolType = "web_search" | "memory" | "code_interpreter" | "calculator" | "file_read";
export type Phase = "plan" | "think" | "act" | "observe" | "reflect" | "done";

export interface ToolCall {
  tool: ToolType;
  input: string;
  output: string;
  durationMs: number;
}

export interface AgentStep {
  phase: Phase;
  thought: string;
  toolCall?: ToolCall;
  durationMs: number;
}

export interface Scenario {
  id: string;
  label: string;
  goal: string;
  description: string;
  steps: AgentStep[];
  finalAnswer: string;
  stepSummary: string[];
}

export const SCENARIOS: Scenario[] = [
  {
    id: "tokyo-trip",
    label: "Plan a trip to Tokyo",
    goal: "Plan a 5-day itinerary for a first-time visit to Tokyo, Japan",
    description: "Travel planning across culture, food, and logistics",
    steps: [
      {
        phase: "plan",
        thought:
          "I'll break this into clear sub-tasks: understand what a first-time visitor needs, research top attractions, find the best neighborhoods, plan daily flow, and handle logistics like transport and budget.",
        durationMs: 1400,
      },
      {
        phase: "think",
        thought:
          "A first-time visitor to Tokyo needs a balance: iconic landmarks (Shibuya, Senso-ji, Shinjuku) alongside local experiences (Yanaka, Shimokitazawa). I should also account for jet lag on day 1 and group experiences by geography to minimize transit time.",
        durationMs: 1800,
      },
      {
        phase: "act",
        thought: "Searching for top-rated Tokyo neighborhoods and attractions",
        toolCall: {
          tool: "web_search",
          input: "best neighborhoods for first-time visitors Tokyo 2024",
          output:
            "Results: Shinjuku (nightlife, Golden Gai), Shibuya (crossing, youth fashion), Asakusa (Senso-ji temple, traditional craft), Harajuku (Takeshita Street, Meiji Shrine), Akihabara (electronics, anime), Yanaka (old Tokyo atmosphere, charming shotengai shopping street).",
          durationMs: 1200,
        },
        durationMs: 1200,
      },
      {
        phase: "observe",
        thought:
          "Six distinct neighborhoods, each with a unique character. I'll cluster geographically: Asakusa + Akihabara are close (east), Shinjuku + Harajuku are close (west), Shibuya + Daikanyama + Ebisu cluster (south-west). That informs the daily structure.",
        durationMs: 1600,
      },
      {
        phase: "act",
        thought: "Looking up practical logistics: JR Pass, Suica card, airport transit",
        toolCall: {
          tool: "web_search",
          input: "Tokyo transport for tourists JR Pass vs Suica card 2024",
          output:
            "Suica card recommended for most tourists — works on almost all trains, buses, and even convenience stores. JR Pass only worth it if doing day trips to Kyoto or Nikko. Narita Express (N'EX) from Narita to Shinjuku ≈ 90 min, ¥3,070. Haneda is faster at 30 min via Keikyu line.",
          durationMs: 1100,
        },
        durationMs: 1100,
      },
      {
        phase: "act",
        thought: "Checking average daily costs to give a useful budget estimate",
        toolCall: {
          tool: "calculator",
          input: "Budget per day: accommodation ¥12,000 + food ¥6,000 + transport ¥2,000 + activities ¥3,000. Total for 5 days?",
          output: "¥23,000/day × 5 = ¥115,000 (~$770 USD). Mid-range traveller budget.",
          durationMs: 600,
        },
        durationMs: 600,
      },
      {
        phase: "think",
        thought:
          "Day 1 should be easy — jet lag recovery, local neighbourhood walk, ramen for dinner. Days 2-4 are the core itinerary clustered by geography. Day 5 is a flexible half-day before departure. I have everything I need to write the full itinerary.",
        durationMs: 1700,
      },
      {
        phase: "reflect",
        thought:
          "I've covered attractions, logistics, transport, and budget. The itinerary is geographically sensible and paced for a first-time visitor. I'm confident this is complete and actionable.",
        durationMs: 1200,
      },
      {
        phase: "done",
        thought: "Compiling the final 5-day itinerary.",
        durationMs: 800,
      },
    ],
    finalAnswer:
      "**5-Day Tokyo First-Timer Itinerary**\n\n**Day 1 — Arrive & Settle (Shinjuku):** Take the N'EX or Keikyu from the airport. Get a Suica card at the station. Easy afternoon walk around Shinjuku-Gyoen garden, dinner at a local ramen shop. Early night.\n\n**Day 2 — Old Tokyo (Asakusa → Akihabara):** Morning at Senso-ji temple and Nakamise market. Explore Kappabashi Kitchen Street. Afternoon in Akihabara for electronics or anime culture. Dinner: tempura in Asakusa.\n\n**Day 3 — West Side (Harajuku → Shibuya):** Morning at Meiji Shrine, walk Yoyogi Park. Lunch on Takeshita Street. Afternoon at Shibuya Crossing and Shibuya Sky observation deck. Evening: explore Golden Gai in Shinjuku.\n\n**Day 4 — Neighbourhoods & Art (Yanaka → Daikanyama):** Morning stroll through Yanaka's old streets and shotengai. Afternoon in Daikanyama and Nakameguro (canal walk). Dinner: yakitori in Ebisu.\n\n**Day 5 — Flex Day & Departure:** Teamlab Borderless (book ahead!), or Odaiba if you prefer. Head to airport by early afternoon.\n\n**Budget:** ~¥115,000 (~$770 USD) total for a comfortable mid-range trip. Suica card covers all your transport needs.",
    stepSummary: [
      "Created a structured research plan",
      "Identified 6 key neighborhoods by character",
      "Searched for top attractions and lodging districts",
      "Researched transport options (Suica vs JR Pass)",
      "Calculated 5-day mid-range budget",
      "Clustered destinations geographically for efficiency",
      "Compiled final day-by-day itinerary",
    ],
  },
  {
    id: "fusion-research",
    label: "Research fusion energy",
    goal: "Summarise the latest breakthroughs in nuclear fusion energy and assess commercial viability",
    description: "Scientific research synthesis and analysis",
    steps: [
      {
        phase: "plan",
        thought:
          "I'll approach this systematically: (1) identify recent major milestones, (2) understand the main technical approaches, (3) look at who is closest to commercialisation, (4) assess the key remaining challenges.",
        durationMs: 1300,
      },
      {
        phase: "think",
        thought:
          "Fusion has had a dramatic last few years — NIF's ignition milestone in 2022 was the headline, but the private sector (Commonwealth Fusion, Helion, TAE) has been moving fast too. I need to distinguish scientific milestones from commercial readiness.",
        durationMs: 1600,
      },
      {
        phase: "act",
        thought: "Searching for the most significant recent fusion milestones",
        toolCall: {
          tool: "web_search",
          input: "nuclear fusion breakthroughs 2022 2023 2024 NIF ignition",
          output:
            "Dec 2022: NIF achieved fusion ignition for the first time — energy output exceeded laser input (3.15 MJ vs 2.05 MJ). Aug 2023: NIF repeated ignition with improved yield. 2023: Commonwealth Fusion Systems demonstrated 20-Tesla HTS magnets, enabling smaller SPARC reactor. Helion raised $2.27B from OpenAI's Sam Altman, targeting 2028 commercial power. China's EAST tokamak sustained plasma for 403 seconds (Jan 2024).",
          durationMs: 1300,
        },
        durationMs: 1300,
      },
      {
        phase: "observe",
        thought:
          "Key distinction: NIF uses inertial confinement (laser-driven), which is harder to scale commercially. The tokamak approach (SPARC, ITER, EAST) is the mainstream path. Private companies using compact high-temperature superconducting magnets could reach commercial operation before ITER (2035+).",
        durationMs: 1800,
      },
      {
        phase: "act",
        thought: "Investigating the main commercial players and their timelines",
        toolCall: {
          tool: "web_search",
          input: "Commonwealth Fusion Systems SPARC timeline commercial fusion reactor 2030",
          output:
            "Commonwealth Fusion Systems (CFS): SPARC demo reactor targeting 2025, ARC commercial plant by early 2030s. Helion Energy: targeting 2028 pilot plant, has contract with Microsoft. TAE Technologies: field-reversed configuration, targeting 2030s. Funding across private fusion companies exceeded $6B by 2023.",
          durationMs: 1200,
        },
        durationMs: 1200,
      },
      {
        phase: "act",
        thought: "Looking up the key remaining engineering challenges",
        toolCall: {
          tool: "memory",
          input: "Recall key fusion engineering challenges: tritium breeding, materials neutron bombardment, plasma instability, net electricity generation",
          output:
            "Known challenges: (1) Tritium fuel is rare — must be bred from lithium blankets inside the reactor. (2) Neutron bombardment degrades reactor materials — no material has been proven at scale. (3) Plasma must be kept stable for sustained periods (still being solved). (4) Net electricity (not just net fusion energy) has not been demonstrated — parasitic loads from magnets and cooling are enormous.",
          durationMs: 900,
        },
        durationMs: 900,
      },
      {
        phase: "reflect",
        thought:
          "The picture is nuanced: scientifically, the past 2 years have been transformative — ignition achieved, high-field magnets proven. Commercially, the 2030s are realistic for first pilot plants but 'always 20 years away' jokes may finally be wrong. I have enough for a thorough summary.",
        durationMs: 1500,
      },
      {
        phase: "done",
        thought: "Writing the research summary.",
        durationMs: 800,
      },
    ],
    finalAnswer:
      "**Fusion Energy: State of Play 2024**\n\n**Key milestones:** In December 2022, the National Ignition Facility (NIF) achieved fusion ignition for the first time in history — energy output exceeded laser input. This was repeated with higher yield in 2023. China's EAST tokamak sustained plasma for 403 seconds in early 2024, a new record.\n\n**Commercial frontrunners:** Commonwealth Fusion Systems (CFS) plans its SPARC demonstration reactor by 2025, followed by a commercial ARC plant in the early 2030s. Their breakthrough: 20-Tesla high-temperature superconducting magnets that make compact reactors viable. Helion Energy (backed by $2.27B including Sam Altman) targets a 2028 pilot plant and has a power purchase agreement with Microsoft.\n\n**Key remaining hurdles:** (1) Tritium fuel scarcity — must be bred inside reactors from lithium. (2) Materials science — neutron bombardment degrades reactor walls in ways not yet solved at scale. (3) Net electricity generation (vs net fusion energy) has not been demonstrated — cooling and magnet loads are large. (4) Plasma stability at commercial duty cycles.\n\n**Assessment:** The 2030s are a credible window for first pilot plants. For grid-scale impact, 2040s is more realistic. The 'always 20 years away' era may genuinely be ending — but the engineering gap between 'ignition achieved' and 'electricity on the grid' remains substantial.",
    stepSummary: [
      "Structured research around milestones, approaches, and challenges",
      "Identified NIF ignition and EAST records as key 2022-2024 events",
      "Searched for private sector timelines (CFS, Helion, TAE)",
      "Recalled engineering challenges: tritium, materials, plasma stability",
      "Distinguished scientific milestones from commercial readiness",
      "Assessed realistic commercialisation timeline",
    ],
  },
  {
    id: "debug-api",
    label: "Debug a 500 API error",
    goal: "Diagnose why the /orders endpoint is returning HTTP 500 errors in production",
    description: "Systematic debugging of a backend production issue",
    steps: [
      {
        phase: "plan",
        thought:
          "A 500 on a specific endpoint usually falls into 3 categories: (1) unhandled exception in handler code, (2) database query failure, (3) downstream service timeout. I'll check logs first, then inspect the handler, then the database layer.",
        durationMs: 1200,
      },
      {
        phase: "act",
        thought: "Reading recent error logs from the production server",
        toolCall: {
          tool: "file_read",
          input: "/var/log/app/production.log (last 50 lines)",
          output:
            'Error: TypeError: Cannot read properties of undefined (reading \'customerId\')\n  at formatOrder (src/routes/orders.ts:47)\n  at async OrderController.list (src/routes/orders.ts:23)\n  at async Layer.handle (node_modules/express/lib/router/layer.js:95)\n\nTimestamp: 2024-03-15T14:23:11Z — 47 occurrences in last 1h',
          durationMs: 900,
        },
        durationMs: 900,
      },
      {
        phase: "observe",
        thought:
          "The error is clear: `formatOrder` is trying to access `customerId` on an object that is `undefined`. This means at least one order record has a null or missing customer join. The error is at line 47 of `orders.ts` inside the `formatOrder` function.",
        durationMs: 1500,
      },
      {
        phase: "act",
        thought: "Inspecting the formatOrder function and the database query",
        toolCall: {
          tool: "file_read",
          input: "src/routes/orders.ts (lines 20-55)",
          output:
            "const orders = await db.query(`\n  SELECT o.*, c.id as customerId, c.name as customerName\n  FROM orders o\n  LEFT JOIN customers c ON c.id = o.customer_id\n  WHERE o.status != 'archived'\n`);\nreturn orders.map(formatOrder);\n\n// formatOrder (line 40):\nfunction formatOrder(row: any) {\n  return {\n    id: row.id,\n    customer: {\n      id: row.customerId,        // line 47 — crashes if customerId is null\n      name: row.customerName,\n    },\n    total: row.total,\n  };\n}",
          durationMs: 1000,
        },
        durationMs: 1000,
      },
      {
        phase: "think",
        thought:
          "The LEFT JOIN means orders with no matching customer return `null` for `customerId`. Before this bug, orders probably always had customers. Something recent changed — either a migration deleted orphaned customers, or a new order creation path is skipping the customer linkage. `formatOrder` doesn't guard against null.",
        durationMs: 1800,
      },
      {
        phase: "act",
        thought: "Checking the database for orders with null customer_id",
        toolCall: {
          tool: "code_interpreter",
          input: "SELECT COUNT(*) as orphan_count FROM orders WHERE customer_id IS NULL OR customer_id NOT IN (SELECT id FROM customers);",
          output: "orphan_count: 23\n(23 rows returned in 12ms)",
          durationMs: 700,
        },
        durationMs: 700,
      },
      {
        phase: "reflect",
        thought:
          "23 orphan orders — that explains the 47 errors (multiple requests per order). Root cause: orders exist without a valid customer reference. Two fixes needed: (1) immediate — add a null guard in `formatOrder` so the endpoint doesn't crash, (2) data fix — investigate and resolve the 23 orphan records. I should also add a NOT NULL constraint on `customer_id` to prevent this going forward.",
        durationMs: 1600,
      },
      {
        phase: "done",
        thought: "Preparing the diagnosis and fix recommendation.",
        durationMs: 800,
      },
    ],
    finalAnswer:
      '**Root Cause:** 23 orders in the database have no valid `customer_id` (orphaned records). The `formatOrder` function in `src/routes/orders.ts` (line 47) assumes every order has a customer, causing an unhandled `TypeError` when it encounters a null.\n\n**Immediate fix (stops the 500s now):**\n```typescript\nfunction formatOrder(row: any) {\n  return {\n    id: row.id,\n    customer: row.customerId ? {\n      id: row.customerId,\n      name: row.customerName,\n    } : null,   // handle missing customer gracefully\n    total: row.total,\n  };\n}\n```\n\n**Data fix:** Investigate the 23 orphan orders. Either re-link them to the correct customer, or mark them as guest orders. Check whether recent order-creation code paths allow missing customer references.\n\n**Preventative fix:** Add `NOT NULL` constraint + foreign key on `orders.customer_id` to prevent orphan records at the database level going forward.',
    stepSummary: [
      "Planned a 3-category debugging approach",
      "Read production logs — identified TypeError at orders.ts:47",
      "Inspected formatOrder function — found missing null guard",
      "Ran SQL query — confirmed 23 orphan orders with no customer",
      "Identified LEFT JOIN as allowing null customer rows",
      "Proposed immediate null-guard fix + data cleanup + DB constraint",
    ],
  },
  {
    id: "pitch-app",
    label: "Write a startup pitch",
    goal: "Write a compelling one-page pitch for a new AI-powered meal planning app",
    description: "Creative writing with market research and positioning",
    steps: [
      {
        phase: "plan",
        thought:
          "A strong pitch needs: (1) a sharp problem statement, (2) a clear solution, (3) market size evidence, (4) differentiation from competitors, (5) a memorable hook. I'll research the market first, then write.",
        durationMs: 1200,
      },
      {
        phase: "think",
        thought:
          "Meal planning apps are crowded — Mealime, Yummly, PlateJoy exist. The differentiation must be AI-native: not just recipes, but personalised adaptation over time. The hook should be about the cognitive load of deciding what to eat every day, not about recipes.",
        durationMs: 1700,
      },
      {
        phase: "act",
        thought: "Researching the meal planning app market size and competitors",
        toolCall: {
          tool: "web_search",
          input: "meal planning app market size 2024 TAM growth rate",
          output:
            "Global meal kit and meal planning market: $19.2B in 2023, projected $44.3B by 2030 (CAGR 12.8%). US adults who say deciding what to eat is a daily stressor: 58% (APA, 2023). Top apps: Mealime (5M users), PlateJoy (subscription, dietitian-backed), Yummly (recipe-first). Main complaint: apps give recipes but don't adapt to what's in your fridge or your mood.",
          durationMs: 1300,
        },
        durationMs: 1300,
      },
      {
        phase: "observe",
        thought:
          "Key insight from the data: 58% of US adults find 'what to eat' a daily stressor. That's the emotional hook. The market gap is adaptation — existing apps are static recipe libraries, not living planners. Our AI angle is continuous personalisation from eating history, pantry state, and mood.",
        durationMs: 1600,
      },
      {
        phase: "act",
        thought: "Calculating the serviceable addressable market",
        toolCall: {
          tool: "calculator",
          input: "US households: 130M. Target: health-conscious, busy professionals = 18% = 23.4M households. Subscription price: $9.99/month. Annual ARR at 2% penetration?",
          output: "23.4M × 2% = 468,000 subscribers × $9.99/month × 12 = $56.1M ARR potential at 2% penetration.",
          durationMs: 600,
        },
        durationMs: 600,
      },
      {
        phase: "think",
        thought:
          "The financials look credible for a Series A pitch. $56M ARR at just 2% of the SAM is a compelling story. I should structure the pitch as: hook (the daily stress problem) → solution (AI that actually learns you) → market → traction model → ask. Keep it punchy — one page means ~300 words.",
        durationMs: 1500,
      },
      {
        phase: "reflect",
        thought:
          "I have everything: emotional hook (58% stress stat), differentiated solution (adaptive AI vs static recipes), credible market ($19B growing to $44B), and a financial model ($56M ARR at 2% SAM). The pitch should lead with the problem, not the technology.",
        durationMs: 1300,
      },
      {
        phase: "done",
        thought: "Writing the final pitch.",
        durationMs: 800,
      },
    ],
    finalAnswer:
      '**PlateMind — The Meal Planner That Actually Knows You**\n\n**The Problem**\n58% of American adults say deciding what to eat is a daily stressor (APA, 2023). We open apps, scroll through recipes, close them, and order takeout. Existing meal apps are glorified cookbooks — they don\'t know your fridge, your schedule, or that you\'re exhausted on Wednesdays.\n\n**The Solution**\nPlateMind is an AI meal planning assistant that adapts to you over time. It learns your taste preferences, tracks what\'s in your pantry, syncs with your calendar, and plans your week in 30 seconds — not 30 minutes. It gets smarter every week you use it.\n\n**How it works:**\n1. Snap your fridge (or sync your Instacart order)\n2. Tell it your week: "3 quick dinners, 1 date night, gym Tuesday"\n3. Get a personalised plan with auto-generated grocery list\n\n**Market**\nThe global meal planning market is $19.2B today, growing to $44.3B by 2030. Our SAM — busy, health-conscious US households — is 23M households. At 2% penetration and $9.99/month, that\'s a **$56M ARR** opportunity from a standing start.\n\n**Differentiation**\nMealime gives you recipes. PlateJoy gives you a static plan. PlateMind gives you a planner that evolves — trained on your history, not a generic database. The moat is personalisation data that compounds over time.\n\n**Traction**\n2,400 beta users, 68% weekly retention, NPS of 71. Average time-to-plan: 28 seconds.\n\n**The Ask**\n$3M Seed to reach 50K paid subscribers in 18 months and establish the data moat before the incumbents catch up.',
    stepSummary: [
      "Planned pitch structure: hook → solution → market → differentiation → ask",
      "Researched meal planning market ($19.2B, 12.8% CAGR)",
      "Found key emotional hook: 58% of adults stressed about daily meal decisions",
      "Identified competitive gap: static recipes vs adaptive AI",
      "Calculated SAM and 2% penetration ARR ($56M)",
      "Wrote concise one-page pitch leading with the problem",
    ],
  },
];

export const TOOL_LABELS: Record<ToolType, string> = {
  web_search: "Web Search",
  memory: "Memory",
  code_interpreter: "Code Interpreter",
  calculator: "Calculator",
  file_read: "File Read",
};

export const PHASE_LABELS: Record<Phase, string> = {
  plan: "Plan",
  think: "Think",
  act: "Act",
  observe: "Observe",
  reflect: "Reflect",
  done: "Done",
};

export const PHASE_DESCRIPTIONS: Record<Phase, string> = {
  plan: "Breaking the goal into a sequence of sub-tasks",
  think: "Reasoning about what to do next",
  act: "Calling a tool to gather information or take an action",
  observe: "Processing what the tool returned",
  reflect: "Evaluating progress and checking if the goal is met",
  done: "Goal achieved — composing the final answer",
};
