# 🧠 Smart Model Switching (Task-Based)

The Gemini CLI includes **intelligent task-based model switching** that automatically selects the optimal model for your request.

## 🚀 Quick Start

Enable smart switching by setting your model to `auto`:

```bash
# Use smart model switching for all requests
npm run start -- --model auto

# Or set it in your prompt
npm run start -- -m auto -p "analyze this codebase"
```

## 🎯 How It Works

When model is set to `auto`, the CLI:

1. **Analyzes your request** using AI classification
2. **Determines complexity** based on sophisticated criteria
3. **Routes to optimal model**:
   - 🔥 **Flash** for simple, well-defined tasks (faster, cost-effective)
   - 🧠 **Pro** for complex, multi-step, or strategic tasks (powerful, thorough)
4. **Provides reasoning** for transparency in decision-making

## 📊 Task Classification

### ⚡ Flash Model (Simple Tasks)

- **File operations**: Read, list, basic searches
- **Simple edits**: Variable renames, single-line changes
- **Direct commands**: 1-3 tool calls, well-defined scope
- **Quick queries**: Specific, bounded questions

**Examples:**

```bash
# These will use Flash ⚡
"Read the contents of package.json"
"List files in the current directory"
"Rename variable 'data' to 'userData' in src/utils.js"
"What is the import statement for lodash?"
```

### 🧠 Pro Model (Complex Tasks)

- **Strategic planning**: "How to" questions, architecture advice
- **Multi-step implementations**: 4+ coordinated changes
- **Debugging**: Unknown problems, root cause analysis
- **High ambiguity**: Broadly defined, extensive investigation needed

**Examples:**

```bash
# These will use Pro 🧠
"How should I architect a data pipeline for analytics?"
"Add email field to User schema, migrate DB, update endpoints"
"Fix this 'Cannot read property map' error when clicking save"
"Analyze this codebase and suggest performance improvements"
```

## 🔍 Classification Criteria

The classifier uses these criteria to determine complexity:

### Complex (Pro) if **ONE OR MORE**:

1. **High Operational Complexity**: 4+ steps/tool calls needed
2. **Strategic Planning**: Requires advice, architecture, conceptual design
3. **High Ambiguity/Large Scope**: Extensive investigation required
4. **Deep Debugging**: Root cause analysis of unknown problems

### Simple (Flash) if:

- **Low Operational Complexity**: 1-3 tool calls
- **Well-defined scope**: Specific, bounded request
- **Direct execution**: Clear action without planning needed

> **Note**: Operational simplicity overrides strategic language. Even if you ask "What's the best way to...", if the underlying task is simple (like a variable rename), it uses Flash.

## 📈 Benefits

### 🎯 **Optimal Performance**

- Fast responses for simple tasks (Flash)
- Powerful analysis for complex tasks (Pro)

### 💰 **Cost Efficiency**

- Automatic cost optimization
- Uses expensive Pro model only when needed

### 🔄 **Seamless Experience**

- No manual model switching required
- Intelligent routing is transparent

### 📊 **Transparency**

- Each decision includes reasoning
- Telemetry tracks routing decisions
- Debug mode shows classification process

## ⚙️ Configuration

### Model Settings

```bash
# Enable smart switching
--model auto

# Force specific model (bypasses smart switching)
--model gemini-2.5-pro
--model gemini-2.5-flash
--model gemini-2.5-flash-lite
```

### Debug Mode

```bash
# See routing decisions and reasoning
npm run start -- --model auto --debug
```

## 🔧 Technical Details

### Architecture

- **ClassifierStrategy**: AI-powered task complexity analysis
- **Routing Pipeline**: FallbackStrategy → OverrideStrategy → **ClassifierStrategy** → DefaultStrategy
- **Model Selection**: Pro (`gemini-2.5-pro`) vs Flash (`gemini-2.5-flash`)
- **Telemetry**: Complete decision tracking and reasoning

### Classification Model

- Uses `gemini-2.5-flash-lite` for classification (fast, cost-effective)
- Structured JSON responses with reasoning
- Context-aware (includes recent conversation history)
- Fallback to DefaultStrategy if classification fails

### Performance

- Classification adds ~100-500ms latency
- Saves significant time on complex tasks (avoids Flash limitations)
- Cost optimization through intelligent routing

## 🧪 Testing Smart Switching

Try these test scenarios to see smart switching in action:

```bash
# Simple tasks (should use Flash) ⚡
npm run start -- -m auto -p "list files in current directory"
npm run start -- -m auto -p "read package.json"

# Complex tasks (should use Pro) 🧠
npm run start -- -m auto -p "how to architect a microservices system?"
npm run start -- -m auto -p "debug this undefined error in my React app"

# Check routing decisions in debug mode
npm run start -- -m auto --debug -p "your test query here"
```

## 📚 Best Practices

1. **Use `auto` as default** for optimal experience
2. **Force specific models** only when you have specific requirements
3. **Monitor telemetry** to understand routing patterns
4. **Trust the classifier** - it's trained on extensive complexity criteria
5. **Use debug mode** to understand routing decisions

## 🔮 Future Enhancements

Potential improvements under consideration:

- User-specific routing preferences
- Learning from user feedback on routing decisions
- Cost budget integration for routing decisions
- Enhanced context awareness for better classification

---

**The smart model switching feature provides the best of both worlds: speed and cost-efficiency of Flash for simple tasks, combined with the power and capability of Pro for complex work. Enable it with `--model auto` and enjoy intelligent, transparent model selection!** 🚀
