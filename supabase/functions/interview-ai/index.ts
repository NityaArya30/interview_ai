import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
interface TestCaseInput {
  input: string;
  expectedOutput: string;
}

interface RequestBody {
  type: "generate_question" | "provide_feedback" | "evaluate_test_cases";
  role?: string;
  difficulty?: string;
  previousQuestions?: string[];
  question?: string;
  answer?: string;
  interviewType?: "behavioral" | "dsa";
  code?: string;
  language?: string;
  testCases?: TestCaseInput[];
  problemTitle?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { type, role, difficulty, previousQuestions, question, answer, interviewType, code, language, testCases, problemTitle } = await req.json() as RequestBody;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Handle test case evaluation separately
    if (type === "evaluate_test_cases") {
      console.log(`Evaluating ${testCases?.length || 0} test cases for problem: ${problemTitle}`);
      
      const evalPrompt = `You are a code execution engine. Analyze the following code and determine the output for each test case. You must be precise and accurate.

Problem: ${problemTitle}

Code (${language}):
\`\`\`${language}
${code}
\`\`\`

Test Cases to evaluate:
${testCases?.map((tc, i) => `Test ${i + 1}: Input: ${tc.input} | Expected Output: ${tc.expectedOutput}`).join('\n')}

IMPORTANT: You must respond with ONLY a valid JSON array. Each element must have:
- "input": the test input string
- "expectedOutput": the expected output string  
- "actualOutput": what the code would actually produce for this input (trace through the code logic carefully)
- "passed": boolean, true ONLY if actualOutput matches expectedOutput exactly

Trace through the code step by step for EACH test case. Be precise about the output format (e.g., [0,1] vs [1,0]).

Respond with ONLY the JSON array, no markdown, no explanation, no code blocks. Example:
[{"input":"[2,7,11,15], 9","expectedOutput":"[0,1]","actualOutput":"[0,1]","passed":true}]`;

      const evalResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are a precise code execution engine. You trace through code and determine exact outputs. Respond ONLY with valid JSON arrays." },
            { role: "user", content: evalPrompt },
          ],
          stream: false,
        }),
      });

      if (!evalResponse.ok) {
        const errorText = await evalResponse.text();
        console.error("AI gateway error for test eval:", evalResponse.status, errorText);
        return new Response(JSON.stringify({ error: "Failed to evaluate test cases" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const evalData = await evalResponse.json();
      let resultContent = evalData.choices?.[0]?.message?.content || "[]";
      
      // Clean up response - remove markdown code blocks if present
      resultContent = resultContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      console.log("Test case evaluation raw result:", resultContent);
      
      try {
        const results = JSON.parse(resultContent);
        return new Response(JSON.stringify({ results, type: "evaluate_test_cases" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (parseError) {
        console.error("Failed to parse test results:", parseError, "Raw:", resultContent);
        // Fallback: return all test cases as needing manual review
        const fallbackResults = testCases?.map(tc => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: "Parse error - could not evaluate",
          passed: false,
        })) || [];
        return new Response(JSON.stringify({ results: fallbackResults, type: "evaluate_test_cases" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "generate_question") {
      systemPrompt = `You are an expert technical interviewer for ${role} positions. Generate challenging, thought-provoking interview questions that test real understanding, not just memorization. Your questions should be practical and relevant to industry standards.`;
      
      const previousQuestionsText = previousQuestions?.length 
        ? `\n\nAvoid these questions that were already asked:\n${previousQuestions.join('\n')}`
        : '';
      
      userPrompt = `Generate a single ${difficulty} difficulty interview question for a ${role} position. 

Requirements:
- The question should be appropriate for ${difficulty} level
- For Easy: Focus on fundamental concepts
- For Medium: Focus on practical application and trade-offs
- For Hard: Focus on system design, optimization, or cutting-edge topics

${previousQuestionsText}

Respond with ONLY the question text, no numbering, no explanations, just the question.`;
    } else if (type === "provide_feedback") {
      const isDSA = interviewType === "dsa" || (answer && answer.includes("Code:"));
      
      if (isDSA) {
        systemPrompt = `You are an expert coding interviewer and algorithm specialist. Evaluate code solutions with extreme precision. You MUST score based on actual code quality — do NOT default to any score. A wrong solution MUST get 1-3, a partially correct one 4-6, a correct but unoptimized one 6-7, and only truly optimal solutions get 8-10.`;
        
        userPrompt = `The coding problem was: "${question}"

The candidate's submission was: "${answer}"

STRICT SCORING RULES — FOLLOW EXACTLY:
- Score 1-2: Code doesn't compile, has syntax errors, or is completely wrong
- Score 3-4: Code has logical errors, fails most test cases, or shows fundamental misunderstanding
- Score 5-6: Code works for basic cases but fails edge cases, or has suboptimal complexity
- Score 7: Code is correct for most cases with reasonable complexity but not optimal
- Score 8: Code is correct, handles edge cases, good complexity, clean style
- Score 9: Code is optimal, elegant, handles all edge cases, production-quality
- Score 10: Exceptional — optimal solution with excellent code quality, documentation, and edge case handling

IMPORTANT: Actually analyze the code logic. If the code has "// Your code here" or placeholder text, score 1. If the logic is wrong, score accordingly LOW. Do NOT give 7+ unless the code genuinely solves the problem correctly.

Provide feedback in this EXACT markdown format:

**Overall Score: [X]/10**

**Summary:**
[2-3 sentences about the solution quality. Be brutally honest.]

**Errors Found:**
- [Error 1 — be specific about what's wrong in the code]
- [Error 2 if applicable]
- [None if code is correct]

**Strengths:**
- [Strength 1]
- [Strength 2]

**Gaps & Missing Edge Cases:**
- [Gap 1 — specific edge case or scenario not handled]
- [Gap 2]

**Improvement Suggestions:**
- [Specific actionable suggestion 1]
- [Specific actionable suggestion 2]

**Ideal/Optimized Solution:**
[Brief description of the optimal approach and why it's better]

**Time & Space Complexity:**
- Submitted: Time O(?), Space O(?)
- Optimal: Time O(?), Space O(?)`;
      } else {
        systemPrompt = `You are an expert technical interviewer providing rigorous, honest feedback. You MUST evaluate each answer independently based on its actual quality. Do NOT default to any score. Short, vague answers get LOW scores. Only genuinely excellent, comprehensive answers get HIGH scores.`;
        
        userPrompt = `The interview question was: "${question}"

The candidate's answer was: "${answer}"

STRICT SCORING RULES — FOLLOW EXACTLY:
- Score 1-2: Answer is completely wrong, irrelevant, off-topic, or empty/meaningless
- Score 3-4: Answer shows minimal understanding but has major errors, misconceptions, or is extremely vague
- Score 5: Answer covers basics but lacks depth, examples, or has notable gaps
- Score 6: Answer is decent, covers main points but misses important details or nuances
- Score 7: Answer is good, covers most key points with some examples, minor gaps
- Score 8: Answer is strong, comprehensive with good examples and clear structure
- Score 9: Answer is excellent, demonstrates deep understanding with real-world insights
- Score 10: Answer is exceptional, professional-level with novel insights and perfect structure

CRITICAL RULES:
- If the answer is less than 30 words, it CANNOT score above 5
- If the answer lacks specific examples, it CANNOT score above 7
- If the answer contains factual errors, deduct at least 2 points
- One-line answers score 1-3 maximum
- Actually READ the answer carefully before scoring

Provide feedback in this EXACT markdown format:

**Overall Score: [X]/10**

**Summary:**
[2-3 sentences honestly assessing the answer quality. State specific weaknesses.]

**Errors Found:**
- [Factual error or misconception 1]
- [Error 2 if applicable]
- [None if answer is factually correct]

**Strengths:**
- [Strength 1 — be specific]
- [Strength 2]
- [Strength 3 if applicable]

**Gaps & Missing Points:**
- [Important topic/concept not covered]
- [Missing example or elaboration]

**Improvement Suggestions:**
- [Specific actionable tip 1]
- [Specific actionable tip 2]

**Ideal Answer Highlights:**
[Key points that a perfect answer would include]

**Recommendation:**
[One specific, actionable next step for improvement]`;
      }
    }

    console.log(`Processing ${type} request for role: ${role}, difficulty: ${difficulty}, interviewType: ${interviewType || 'auto'}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to generate AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Extract score from feedback if applicable
    let score: number | undefined;
    if (type === "provide_feedback") {
      const scoreMatch = content.match(/\*\*Overall Score:\s*(\d+)\/10\*\*/);
      if (scoreMatch) {
        score = parseInt(scoreMatch[1], 10);
      }
    }

    console.log(`Successfully generated ${type} response, score: ${score}`);

    return new Response(JSON.stringify({ 
      content,
      score,
      type 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Interview AI error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
