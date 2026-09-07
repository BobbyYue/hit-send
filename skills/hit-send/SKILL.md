---
name: hit-send
description: Check and minimally revise short workplace messages before sending, or draft a reply from selected message context. Use when the user asks "这句能发吗", "帮我顺一下", "这句话得体吗", "润色飞书消息", "这句怎么回", "怎么催比较合适", "这样回复会不会太冲", or wants a clearer, more natural, easier-to-act-on version of an IM, comment, short email, request, status update, disagreement, escalation, or risk message. Preserve the writer's intent and everyday voice; do not turn casual language into template-sounding corporate prose. Never send the message or take the requested business action.
---

# Hit Send

**发之前，让 AI 替对方先读一遍。**

Judge whether a workplace message is ready to send. Change it only when a change materially improves understanding, actionability, tone, or closure.

## Core Contract

Apply this priority when goals conflict:

`original intent and facts` → `recipient comprehension` → `actionability` → `relationship and emotional safety` → `brevity` → `surface polish`

- Never send, post, reply, mention, or take the business action described in the message.
- Preserve names, numbers, dates, links, commitments, uncertainty, and scope. Never invent missing facts.
- Preserve the writer's natural register, directness, and relationship with the recipient.
- Prefer the smallest useful edit. If the original is ready, say so and return it unchanged.
- Do not make a short message longer unless missing context or action would otherwise create another round trip.
- Do not hide legitimate disagreement, urgency, emotion, or accountability behind vague politeness.
- Remove claims about another person's motives, character, or attitude unless the user explicitly needs to quote them.
- Preserve the message's job and stance, not just its topic. Do not turn an observation, disagreement, refusal, or expression of frustration into an action request unless the source or user supplies that goal.
- When replacing a motive judgment, do not invent a different outcome. Recast it as the writer's perception, or use only observable facts already present in the source.
- Treat the method as an internal checklist, not a visible five-part template.

## Runtime Workflow

### 0. Identify the task

- `rewrite` or an omitted task: judge and minimally revise the supplied draft.
- `reply`: treat selected messages as context, not as text to rewrite. Draft a reply using only the supplied context and the writer's optional reply goal.

For `reply`, do not invent status, decisions, ownership, deadlines, agreement, or commitments. If the context does not support a substantive answer, produce a natural clarification or acknowledgement that exposes the missing decision or information.

### 1. Infer the message job

Classify the message as one or more of:

- synchronize;
- request help or input;
- ask for confirmation;
- ask for a decision;
- disagree or correct;
- remind or escalate;
- report risk;
- close a decision or handoff;
- respond to emotion.

Use surrounding context when supplied. Do not ask a question unless a missing fact makes a responsible rewrite impossible.

Also infer the writer's apparent outcome: inform, ask, decide, preserve a disagreement, move work forward, set a boundary, or leave a record. If choosing between plausible outcomes would change the stance or add an action, use the most meaning-preserving recommendation and do not silently choose a new goal.

### 2. Select the needed depth

- **Light**: shared context, one fact or action. Keep it to one or two natural sentences.
- **Routine**: normal collaboration or confirmation. Usually three to five short sentences.
- **Complex**: cross-team decision, high risk, disagreement, or handoff. Put the conclusion first and use short paragraphs or bullets only when they improve scanning.

### 3. Run the send check

Check in this order:

1. **Intent**: Can the recipient tell from the first sentence why they received it?
2. **Action**: Is it clear who needs to do what?
3. **Time**: Is timing explicit when it affects coordination?
4. **Context**: Is there enough background to judge, without a history dump?
5. **Judgment**: Has the writer provided a view, recommendation, or clear uncertainty instead of forwarding raw work?
6. **Reply cost**: Can the recipient answer with a decision, option, status, or specific edit?
7. **Tone**: Are facts separated from assumptions about motives, competence, or attitude?
8. **Channel**: Would a short call, private message, task, or document be cheaper or safer than more chat?
9. **Closure**: For important work, are the conclusion, owner, next update, and record location clear?

The minimum bar is understanding why this person received the message. Check action and timing only when the original message or supplied goal calls for them; a clear factual update or disagreement needs no invented request.

### 4. Decide before rewriting

Choose exactly one outcome:

- `pass`: ready to send; return the original exactly.
- `polish`: local wording or ordering changes are enough.
- `rewrite`: the message needs structural work to become understandable or actionable.
- `switch_channel`: text is unlikely to resolve the issue; return a short transition message and channel advice.

Do not rewrite merely to demonstrate activity.

### 5. Apply the minimum useful change

Use the internal sequence `来意 + 必要背景 + 我的判断 + 对方行动 + 时间或闭环`, but merge or omit parts according to complexity.

- Put the conclusion, risk, or request before supporting history.
- Keep only context that changes priority, scope, judgment, or ownership.
- Convert "看一下", "跟进一下", "尽快", and "大家" into a bounded action when the source supports it.
- If the source gives a downstream deadline but not a safe delivery deadline, ask for current status and an estimated completion time. Do not preserve "尽快" or invent a delivery commitment.
- Treat changing one vague urgency word into another, such as `赶紧` → `尽快`, as a failed rewrite.
- Offer a recommendation or A/B choice when doing so reduces decision effort.
- Separate fact, inference, impact, and recommendation.
- For reminders and disagreements, clarify supported facts and relevant impact; use `fact → impact → request` only when the original or supplied goal includes an action request. Preserve an observation, refusal, or disagreement without adding a next step.
- For risk, include current state, evidence or uncertainty, impact, action already underway, and next decision or update.
- For emotional messages, read [references/method.md](references/method.md) before rewriting.
- For system integrations or machine output, read [references/product-contract.md](references/product-contract.md).
- Preserve temporal contrasts such as `现在` versus `当时`; do not flatten them into generic agreement.
- Do not introduce a completion state, consensus, owner, action, deadline, commitment, or recommendation that the source does not support.
- Preserve who is speaking, acting, deciding, or owning the work. If the source does not identify a person or group, do not invent one.
- When repetition hides the point, express the existing change, comparison, condition, tradeoff, or impact with the fewest necessary words. Keep decisive qualifiers beside the statement. Use parallel clauses only for real same-dimension comparisons, preserving direction and uncertainty; never manufacture an opposite, cause, winner, deadline, or request. In the existing send check, confirm the recipient can restate the intended relationship. Leave clear single facts unchanged and stop when clear; rhythm and word count alone do not justify revision.

### 6. Decide whether alternatives add value

Versions must represent different communication strategies, not synonym swaps.

- `pass`: return the original only. Do not manufacture alternatives.
- Normal `polish` or `rewrite`: return one recommended version. Add one materially different strategy version only when it gives the user a useful choice.
- When the user explicitly asks for several versions: return at most three total versions.
- `switch_channel`: prioritize one safe transition message. Add another only when it represents a genuinely different channel strategy.
- Always mark one version as recommended. Do not transfer an unstructured choice back to the user.
- If a second version would only paraphrase the first, omit it rather than creating decorative variety. Never change the communication goal merely to manufacture an alternative.

Choose differences by message job:

| Message job | Useful strategy differences |
|---|---|
| Synchronize or report analysis | concise conclusion / conclusion with evidence / conclusion with next step |
| Request help | natural request / bounded action and timing / alternative path |
| Remind or escalate | light reminder / status and estimate / impact and explicit request |
| Disagree or correct | direct factual correction / align on the shared goal / correction with alternative |
| Report risk | brief alert / complete risk framing / request a decision or resource |
| Close or hand off | concise conclusion / owner and timing / full traceable closure |

### 7. Surface actionable coaching

When the original message materially violates the communication method, remind the user instead of silently returning only rewritten text.

Use at most three reminders, ordered by impact. Each reminder must state:

1. the communication dimension;
2. the concrete problem in the original;
3. one specific way to improve it.

Supported dimensions are:

- `intent`: the recipient cannot tell why they received the message;
- `conclusion`: multiple facts or analysis appear without the takeaway;
- `context`: necessary context is missing, or details bury the task;
- `judgment`: the writer transfers raw material without a view when a view is needed;
- `action`: the owner, action, scope, or completion standard is unclear;
- `timing`: coordination depends on timing but no usable time or estimate request is present;
- `emotion`: emotion has become accusation, sarcasm, motive judgment, or a loaded rhetorical question;
- `reply_cost`: the recipient must reconstruct the question or invent the reply format;
- `closure`: an important decision, handoff, or risk has no owner, next update, or record location;
- `channel`: text is the wrong medium for the conflict, sensitivity, or complexity.

Apply these boundaries:

- Do not demand a judgment in a simple factual update, acknowledgement, or genuine information question.
- Do not demand a conclusion from a single clear fact or lightweight request.
- When two or more comparable facts or metrics are followed by a vague `看下` or decision request, prioritize a `conclusion` or `judgment` reminder before generic action or reply-cost reminders.
- If the source does not support one safe recommendation, state the observable tradeoff and ask for the missing decision criterion. Do not invent a winner.
- Never call one option `最好` when metrics trade off and the writer has not supplied a priority, weight, or decision standard.
- Do not demand timing when timing does not affect coordination.
- Distinguish expressing emotion from emotionalized expression. `我担心会影响明天上线` is useful; `你们到底有没有在推进` assigns blame and should be translated into supported fact, impact, and the original request when present.
- Do not report surface polish, punctuation, or stylistic preferences as method violations.
- Prefer specific dimensions over `reply_cost`; do not report both `action` and `reply_cost` when they describe the same underlying ambiguity.
- If no material gap exists, return no reminders.

## Default Human Output

Keep the response compact:

1. Start with `可以直接发` or one short diagnosis.
2. If `pass`, return the original exactly and stop.
3. Otherwise show `推荐版`, then a clearly labeled strategy alternative only when it adds a useful choice.
4. If the user explicitly requests several versions, show at most three total.
5. When material method gaps exist, add `发送前提醒` with up to three items. Format each as `维度：具体问题。怎么改：具体建议。`
6. Add channel advice only when text is the wrong medium.

Use labels that explain the strategic difference, such as `自然简洁`, `清楚推进`, `完整稳妥`, `结论结构`, or `谨慎判断`. Avoid empty labels such as `版本一` and `版本二` when a useful distinction is available.

## Machine JSON Mode

When the caller requests `MACHINE_JSON`, return only JSON matching [scripts/response.schema.json](scripts/response.schema.json).

- `revised_text` must equal the input exactly when `decision` is `pass`.
- `revised_text` is always the recommended version.
- `recommended_label` names the recommended strategy without including the word `推荐`.
- `alternatives` is empty for `pass`; normal `polish` and `rewrite` return zero or one useful alternative. Treat `variant_count` as a maximum, not a quota.
- Each alternative has a short `label`, complete `text`, and one-sentence `rationale` explaining the practical tradeoff.
- Alternative texts must preserve the same facts and intent, remain send-ready on their own, and differ materially from the recommended strategy.
- `summary` is a short reader-facing judgment, not process narration.
- `summary` states the recipient-facing diagnosis; avoid process narration such as "已优化" or "已调整".
- `findings` normally contains zero to two structured reminders, ordered by impact. Use three only for high-risk or channel-switching cases.
- Each finding contains `dimension`, `issue`, and `suggestion`. It diagnoses the original message and gives a concrete improvement, not a narration of edits already made.
- `findings` must be empty when no material communication-method gap exists.
- `channel_advice` is an empty string unless changing channel would materially reduce cost or conflict.
- For `reply`, `revised_text` is the recommended reply and `pass` is not a valid decision because there is no original draft to approve.

## Method Reference

Read [references/method.md](references/method.md) for the compact communication method and edge cases.
