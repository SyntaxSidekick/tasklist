<?php

class Validator {
    private $data;
    private $rules;
    private $errors = [];
    
    public function __construct($data, $rules) {
        $this->data = $data;
        $this->rules = $rules;
    }
    
    public function validate() {
        foreach ($this->rules as $field => $ruleString) {
            $rules = explode('|', $ruleString);
            $value = $this->data[$field] ?? null;
            
            foreach ($rules as $rule) {
                $this->applyRule($field, $value, $rule);
            }
        }
        
        return empty($this->errors);
    }
    
    private function applyRule($field, $value, $rule) {
        if (strpos($rule, ':') !== false) {
            list($ruleName, $ruleValue) = explode(':', $rule, 2);
        } else {
            $ruleName = $rule;
            $ruleValue = null;
        }
        
        switch ($ruleName) {
            case 'required':
                if (empty($value) && $value !== '0' && $value !== 0) {
                    $this->errors[$field][] = ucfirst($field) . ' is required';
                }
                break;
                
            case 'email':
                if ($value && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    $this->errors[$field][] = ucfirst($field) . ' must be a valid email';
                }
                break;
                
            case 'min':
                if ($value && strlen($value) < $ruleValue) {
                    $this->errors[$field][] = ucfirst($field) . " must be at least {$ruleValue} characters";
                }
                break;
                
            case 'max':
                if ($value && strlen($value) > $ruleValue) {
                    $this->errors[$field][] = ucfirst($field) . " must not exceed {$ruleValue} characters";
                }
                break;
                
            case 'numeric':
                if ($value && !is_numeric($value)) {
                    $this->errors[$field][] = ucfirst($field) . ' must be numeric';
                }
                break;
                
            case 'in':
                $allowed = explode(',', $ruleValue);
                if ($value && !in_array($value, $allowed)) {
                    $this->errors[$field][] = ucfirst($field) . ' must be one of: ' . implode(', ', $allowed);
                }
                break;
        }
    }
    
    public function errors() {
        return $this->errors;
    }
    
    public static function make($data, $rules) {
        $validator = new self($data, $rules);
        return $validator;
    }
}
