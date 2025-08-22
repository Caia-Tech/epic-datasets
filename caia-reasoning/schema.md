{
  "reasoning_example": {
    "id": "string",
    "metadata": {
      "domain": "string",                     
      "sub_domain": "string",                 
      "task_type": "string",                  
      "difficulty": "string",                 
      "source": "string",                     
      "source_creator": "string",             
      "language": "string",                   
      "is_synthetic": "boolean",              
      "tags": [ "string" ],                    
      "citations": [                          
        {
          "title": "string",
          "url": "string",
          "author": "string",
          "publication_date": "string"
        }
      ],
      "created_at": "string",                 
      "updated_at": "string"                  
    },
    "conversation_context": {
      "turn_number": "integer",
      "clarifications_needed": [ "string" ],
      "assumptions_made": [ "string" ],
      "previous_turns": [
        {
          "turn": "integer",
          "summary": "string"
        }
      ]
    },
    "input": {
      "problem": "string",                   
      "problem_format": "string",            
      "context": [ "string" ],               
      "constraints": [ "string" ],           
      "input_variables": [                   
        {
          "name": "string",
          "type": "string",
          "description": "string"
        }
      ],
      "data_dependencies": [
        {
          "name": "string",
          "description": "string"
        }
      ]
    },
    "scratchpad": {
      "style": "string",                      
      "steps": [
        {
          "id": "string",
          "step_number": "integer",
          "action": "string",                 
          "reasoning": "string",              
          "result": "string",
          "correctness_label": "string",
          "importance_score": "number",
          "alternatives_considered": [ "string" ],
          "uncertainty": {
            "epistemic": "number",
            "aleatoric": "number"
          },
          "tool_usage": {
            "tool_name": "string",            
            "input": "string",
            "output": "string"
          },
          "step_source": "string",            
          "timestamp": "string"
        }
      ],
      "dead_ends": [                          
        {
          "path_summary": "string",
          "reason_for_failure": "string"
        }
      ],
      "evaluations": [                        
        {
          "check": "string",
          "status": "string",                 
          "details": "string"
        }
      ]
    },
    "verification": {
      "self_critique": "string",
      "error_analysis": [ "string" ],
      "robustness_checks": [
        {
          "input_variation": "string",
          "still_valid": "boolean",
          "explanation": "string"
        }
      ],
      "consistency_checks": [
        {
          "check_type": "string",
          "passed": "boolean",
          "details": "string"
        }
      ]
    },
    "preferences": {
      "helpfulness": "integer",
      "harmlessness": "integer",
      "honesty": "integer",
      "coherence": "integer",
      "depth": "integer",
      "creativity": "integer"
    },
    "final": {
      "answer": "string",                     
      "answer_format": "string",              
      "explanation": "string",                
      "confidence": "number",
      "confidence_breakdown": {
        "answer_confidence": "number",
        "reasoning_confidence": "number",
        "assumptions_confidence": "number"
      },
      "alternative_answers": [ "string" ],    
      "reasoning_tokens": "integer",          
      "answer_tokens": "integer",
      "total_thinking_time_ms": "integer"
    }
  }
}