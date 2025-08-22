# CAIA-Reasoning Dataset

A high-quality dataset for training and evaluating Large Language Models on fundamental reasoning tasks. This dataset emphasizes authentic mathematical thinking, process supervision, and self-verification with null confidence values to avoid arbitrary assessments.

## Overview

CAIA-Reasoning provides structured reasoning traces for elementary mathematical and logical reasoning tasks, capturing authentic thinking processes including genuine errors, self-corrections, and proper mathematical notation. Each example follows a comprehensive schema supporting Process Reward Modeling (PRM) and modern AI training techniques.

### Key Features

- **Authentic reasoning**: Genuine mathematical thinking without fake confusion
- **Process-level supervision**: Step-by-step correctness labels and importance scores
- **Null confidence values**: Avoids arbitrary confidence assessments
- **Self-verification**: Built-in critique, error analysis, and robustness checks
- **Real tool usage**: Realistic calculator inputs (e.g., "15 * 20" not "LCM(4, 3)")
- **Mathematical rigor**: Proper notation like aₙ = a₁ + (n-1)d for arithmetic sequences
- **Preference learning**: Multi-dimensional ratings for helpfulness, harmlessness, honesty

## Schema Documentation

### Core Structure

Each example contains:
- `id`: Unique identifier
- `metadata`: Domain, difficulty, source information
- `conversation_context`: Multi-turn interaction tracking
- `input`: Problem statement with constraints and context
- `scratchpad`: Complete reasoning process with steps and evaluations
- `verification`: Self-critique and consistency checks
- `preferences`: Human preference ratings
- `final`: Answer with confidence breakdown

### Field Definitions

#### Metadata Fields
- `domain`: Primary reasoning domain (see Domain Taxonomy)
- `sub_domain`: Specific area within domain
- `task_type`: Type of reasoning task
- `difficulty`: `elementary` | `intermediate` | `advanced` | `expert`
- `source`: Dataset or origin of the problem
- `is_synthetic`: Whether generated or human-created
- `tags`: Additional categorization labels

#### Reasoning Styles (`scratchpad.style`)
- `chain_of_thought`: Linear step-by-step reasoning
- `tree_search`: Exploration with backtracking
- `working_backwards`: Goal-oriented reverse planning
- `analogical`: Reasoning by comparison
- `case_analysis`: Breaking into cases
- `proof_by_contradiction`: Assume opposite, derive contradiction
- `constitutional_ai`: Reasoning with principles/values
- `debate`: Multiple viewpoints arguing
- `recursive_decomposition`: Breaking into sub-problems
- `metacognitive`: Reasoning about reasoning

#### Step Fields (`scratchpad.steps`)
- `correctness_label`: `correct` | `incorrect` | `neutral`
- `importance_score`: 0.0-1.0 (criticality of step)
- `alternatives_considered`: Other approaches attempted
- `uncertainty.epistemic`: Knowledge uncertainty (0.0-1.0)
- `uncertainty.aleatoric`: Inherent randomness (0.0-1.0)

#### Verification Fields
- `self_critique`: Model's assessment of its reasoning
- `error_analysis`: Identified mistakes or weaknesses
- `robustness_checks`: Testing with input variations
- `consistency_checks`: Logical consistency validation

#### Preference Ratings
All ratings are 1-5 scale:
- `helpfulness`: How well it addresses the problem
- `harmlessness`: Avoidance of harmful content
- `honesty`: Acknowledgment of limitations
- `coherence`: Logical flow and clarity
- `depth`: Thoroughness of exploration
- `creativity`: Novel approaches or insights

## Current Dataset Contents

### Version 2.0 - Expanded Collection

The current dataset contains **277 high-quality examples** across multiple domains:

#### Mathematical Reasoning (96 examples)
- Arithmetic, algebra, geometry, calculus foundations
- Counting/combinatorics problems
- Contrapositive proofs and modular arithmetic
- Disproof methods and counterexamples
- Function theory (composition, inverses, bijections)

#### Programming (15 examples)
- Elementary Python (variables, loops, functions)
- Intermediate Python (OOP, file handling, decorators)
- Advanced Python (async, metaclasses, optimization)

#### Computer Science (10 examples)
- **Algorithms** (5): QuickSort, Edit Distance, Dijkstra, Merge Sort, Huffman Coding
- **Data Structures** (5): B-Tree, Trie, Union-Find, Skip List, Segment Tree

#### Other Domains (115 examples)
- Logical reasoning and pattern recognition
- Analogical reasoning
- Causal reasoning
- Conversational reasoning
- Metacognitive reasoning
- Scientific reasoning

### Planned Expansions

#### Next Phases (In Development)
- **Logic puzzles**: Constraint satisfaction, deductive reasoning
- **Common sense reasoning**: Practical problem-solving scenarios
- **Coding problems**: Algorithm design and debugging

#### Future Domains
- **Causal reasoning**: Cause-effect relationships
- **Strategic planning**: Multi-step resource allocation
- **Scientific reasoning**: Hypothesis testing and experimentation
- **Ethical reasoning**: Value-based decision making

## Data Collection Guidelines

### High-Quality Example Criteria

1. **Authentic reasoning**: No fake confusion - reason logically and mathematically
2. **Complete reasoning traces**: Include all steps, not just successful paths
3. **Null confidence values**: Avoid arbitrary confidence assessments
4. **Dead ends documented**: Show failed approaches and why they failed
5. **Realistic tool usage**: Calculator inputs like "15 * 20" not "LCM(4, 3)"
6. **Mathematical rigor**: Use proper notation (aₙ, subscripts, formulas)
7. **Self-verification**: Include checking steps and validation

### Creating Examples

#### Step 1: Problem Selection
- Choose problems with clear correctness criteria
- Ensure sufficient complexity for multi-step reasoning
- Include necessary context and constraints

#### Step 2: Reasoning Generation
- Document each reasoning step explicitly
- Include metacognitive observations
- Mark tool usage when external capabilities needed
- Track confidence and uncertainty

#### Step 3: Verification
- Add self-critique identifying potential issues
- Test robustness with input variations
- Check logical consistency
- Document any corrections made

#### Step 4: Annotation
- Label step correctness retrospectively
- Assign importance scores based on solution impact
- Rate preference dimensions
- Add relevant tags and metadata

## Evaluation Metrics

### Process-Level Metrics
- **Step Accuracy**: Percentage of correct reasoning steps
- **Critical Step Accuracy**: Accuracy on high-importance steps
- **Dead End Rate**: Frequency of unproductive paths
- **Recovery Rate**: Success after encountering errors

### Outcome Metrics
- **Final Answer Accuracy**: Correctness of final answer
- **Confidence Calibration**: Alignment of confidence with correctness
- **Alternative Quality**: Validity of alternative answers

### Preference Metrics
- **Average Preference Score**: Mean across all dimensions
- **Dimension Correlation**: Relationship between different preferences
- **Human Agreement**: Inter-annotator agreement on ratings

## Usage Examples

### Example: Fraction Addition (elem_math_001)

```json
{
  "reasoning_example": {
    "id": "elem_math_001",
    "metadata": {
      "domain": "mathematical_reasoning",
      "sub_domain": "arithmetic",
      "task_type": "multi_step_calculation",
      "difficulty": "elementary",
      "tags": ["fractions", "addition", "real_world"]
    },
    "input": {
      "problem": "Tom ate 1/4 of a pizza for lunch and 1/3 of a pizza for dinner. How much pizza did he eat in total?",
      "constraints": ["Express answer as a fraction"]
    },
    "scratchpad": {
      "style": "chain_of_thought",
      "steps": [
        {
          "step_number": 2,
          "action": "Try to add directly",
          "reasoning": "Can I just add 1/4 + 1/3? That would be... 2/7? No wait, that doesn't work with fractions",
          "result": "Can't add fractions with different denominators directly",
          "correctness_label": "incorrect",
          "importance_score": 0.6
        },
        {
          "step_number": 3,
          "action": "Find common denominator",
          "reasoning": "Right, I need a common denominator. What's a number both 4 and 3 go into? Let's see... 4, 8, 12... and 3, 6, 9, 12... So 12 works!",
          "result": "Common denominator is 12",
          "correctness_label": "correct",
          "importance_score": 1.0
        }
      ],
      "dead_ends": [
        {
          "path_summary": "Tried to add numerators and denominators directly (1+1)/(4+3) = 2/7",
          "reason_for_failure": "That's not how fraction addition works - need common denominator"
        }
      ]
    },
    "final": {
      "answer": "7/12",
      "confidence": null,
      "explanation": "Tom ate 7/12 of a pizza total (1/4 + 1/3 = 3/12 + 4/12 = 7/12)"
    }
  }
}
```

### Example: Geometric Sequence (pattern_003)

```json
{
  "reasoning_example": {
    "id": "pattern_003",
    "metadata": {
      "domain": "logical_reasoning",
      "sub_domain": "pattern_recognition",
      "task_type": "sequence_completion",
      "difficulty": "elementary",
      "tags": ["geometric_sequence", "multiplication"]
    },
    "input": {
      "problem": "Find the next number: 2, 6, 18, 54, ?",
      "constraints": ["Identify the pattern and find next term"]
    },
    "scratchpad": {
      "style": "working_backwards",
      "steps": [
        {
          "step_number": 1,
          "action": "Check for multiplicative pattern",
          "reasoning": "Calculate ratios between consecutive terms to test for geometric sequence",
          "result": "6/2=3, 18/6=3, 54/18=3",
          "correctness_label": "correct",
          "importance_score": 1.0
        },
        {
          "step_number": 2,
          "action": "Confirm geometric sequence",
          "reasoning": "Common ratio r=3 confirmed. This is geometric sequence with a₁=2, r=3",
          "result": "Geometric sequence: aₙ = 2 × 3^(n-1)",
          "correctness_label": "correct",
          "importance_score": 0.9
        }
      ],
      "tool_usage": {
        "tool_name": "calculator",
        "input": "54 * 3",
        "output": "162"
      }
    },
    "final": {
      "answer": "162",
      "confidence": null,
      "explanation": "Geometric sequence with first term a₁=2 and common ratio r=3. Next term: 54×3=162"
    }
  }
}
```

## Data Format

The dataset is currently provided as:
- **JSON** (`caia-reasoning.json`): Single file with all examples
- **Individual JSON files** (`data/` folder): Development and batch files

### File Structure
```
caia-reasoning/
├── caia-reasoning.json          # Main dataset (10 examples)
├── schema.md                    # Complete schema documentation
├── README.md                    # This file
└── data/                        # Development files
    ├── elementary_math_batch1_refined.json
    └── pattern_recognition_batch1_revised.json
```

## License

[Specify your license here]

## Citation

```bibtex
@dataset{caia_reasoning_2024,
  title={CAIA-Reasoning: A Comprehensive Dataset for LLM Reasoning and Planning},
  author={[Your Name]},
  year={2024},
  publisher={[Publisher]}
}
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:
- Adding new examples
- Improving annotations
- Extending domains
- Reporting issues

## Contact

[Your contact information]