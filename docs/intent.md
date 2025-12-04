# Intent & Philosophy

## What This Tool Is For

This MCP server provides **objective data for better conversations**, not surveillance metrics for micromanagement.

### ✅ Good Use Cases

**Sprint Retrospectives**
- "What did we accomplish this sprint?"
- "Where did we spend most of our time?"
- Saves 15-30 minutes of manual git log parsing

**Code Quality Insights**
- "Which files are changing most frequently?" (high churn = potential issues)
- "Where should we focus code reviews?"
- "Do we have technical debt hotspots?"

**Team Health Monitoring**
- "Are people committing late at night or on weekends?" (burnout indicator)
- "Is work distributed evenly or is someone overwhelmed?"
- Early warning signs for proactive intervention

**Risk Management**
- "What's our bus factor?" (knowledge concentration)
- "Who's the only person who knows this critical code?"
- Succession planning and knowledge sharing

**Onboarding Tracking**
- "How is the new developer ramping up?"
- Objective data for coaching conversations
- Identify where they need more support

### ❌ What This Is NOT For

**Micromanagement**
- ❌ Checking individual commit counts daily
- ❌ Comparing developers against each other
- ❌ Using metrics as performance review ammunition
- ❌ Surveillance or "productivity monitoring"

**Performance Evaluation**
- ❌ Commits ≠ value delivered
- ❌ Lines of code ≠ quality
- ❌ Activity ≠ impact

## Philosophy

### Data as Conversation Starter

**Instead of:**
- ❌ "Why did you only commit 5 times this week?"
- ❌ "Your velocity is down 20%"
- ❌ "Bob commits more than you"

**Use it for:**
- ✅ "I noticed high churn on auth.ts - need help?"
- ✅ "Lots of late-night commits lately - too much on your plate?"
- ✅ "This file has 3 authors - should we pair on it?"
- ✅ "We haven't touched this module in 6 months - is it stable or forgotten?"

### Trust Over Surveillance

This tool assumes:
- Your team is competent and motivated
- Context matters more than raw numbers
- Trends are more valuable than snapshots
- Questions are better than accusations

### Frequency Guidelines

**Recommended:**
- Weekly: Quick health check (5 min)
- Sprint end: Retrospective insights (15 min)
- Monthly: Trend analysis (30 min)
- Quarterly: Strategic review (1 hour)

**Not Recommended:**
- Daily individual tracking
- Real-time monitoring
- Comparative rankings
- Automated alerts on low activity

## When to Use This Tool

### ✅ You Should Use This If:

- You lead a team (3+ developers)
- You do regular retrospectives
- You care about code quality trends
- You want data-driven conversations
- You're looking for process improvements
- You need to identify risks early

### 🚫 Skip This Tool If:

- Solo developer
- Team < 3 people
- You trust your gut more than data
- Your team would see it as surveillance
- You're looking for "productivity scores"
- You want to compare developers

## Red Flags (Don't Do This)

If you find yourself doing any of these, **stop and reconsider**:

- Checking metrics more than once per day
- Asking "why" about individual commit counts
- Creating leaderboards or rankings
- Setting commit quotas or targets
- Using metrics in performance reviews without context
- Monitoring in real-time
- Comparing developers directly

## Green Flags (Good Usage)

You're using this tool well if:

- You check trends weekly/monthly, not daily
- You ask "what does this tell us about our process?"
- You use it to start conversations, not end them
- You combine metrics with qualitative feedback
- You focus on team health, not individual performance
- You look for patterns, not outliers
- You use it to help, not judge

## Example Conversations

### Good: Process Improvement
```
"I noticed auth.ts has been modified 25 times this month. 
That's unusual. Should we refactor it or is it just evolving?"
```

### Good: Team Support
```
"The commit patterns show a lot of weekend work lately. 
Are we overloaded? Should we adjust sprint capacity?"
```

### Good: Risk Management
```
"Only Sarah has touched the payment module in 6 months. 
Should we do some knowledge sharing sessions?"
```

### Bad: Micromanagement
```
"You only committed 3 times this week. Everyone else did 10+. 
What's going on?"
```

### Bad: Comparison
```
"Bob's velocity is 2x yours. Why aren't you keeping up?"
```

## The Bottom Line

**This tool is a mirror, not a microscope.**

Use it to reflect on team health and process quality, not to scrutinize individual behavior.

If you're asking "is this micromanagement?" - you're probably safe. Micromanagers don't ask that question.

---

**Remember:** The best teams are built on trust, not metrics. Use this tool to support your team, not surveil them.
