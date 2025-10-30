# Technical Specification: {{FEATURE_NAME}}

**Author**: {{AUTHOR}}
**Date**: {{DATE}}
**Status**: {{STATUS}}
**Reviewers**: {{REVIEWERS}}

---

## Overview

### Summary
{{SUMMARY}}

### Related Documents
- [PRD]({{PRD_LINK}})
- [Design Doc]({{DESIGN_LINK}})

### Related Issues
- [{{ISSUE_1}}]({{ISSUE_1_LINK}})
- [{{ISSUE_2}}]({{ISSUE_2_LINK}})

---

## Goals & Non-Goals

### Goals
1. {{GOAL_1}}
2. {{GOAL_2}}
3. {{GOAL_3}}

### Non-Goals
1. {{NON_GOAL_1}}
2. {{NON_GOAL_2}}

---

## Background

### Current System
{{CURRENT_SYSTEM_DESCRIPTION}}

### Motivation
{{MOTIVATION}}

### Constraints
- {{CONSTRAINT_1}}
- {{CONSTRAINT_2}}
- {{CONSTRAINT_3}}

---

## Proposed Solution

### Architecture Overview

{{ARCHITECTURE_DESCRIPTION}}

```
┌─────────────┐         ┌─────────────┐
│   Component │────────▶│  Component  │
│      A      │         │      B      │
└─────────────┘         └─────────────┘
```

### Component Design

#### Component 1: {{COMPONENT_1_NAME}}
**Responsibility**: {{COMPONENT_1_RESPONSIBILITY}}

**Interfaces**:
```typescript
interface {{COMPONENT_1_INTERFACE}} {
  {{METHOD_1}}: {{TYPE_1}};
  {{METHOD_2}}: {{TYPE_2}};
}
```

**Implementation Notes**:
{{COMPONENT_1_NOTES}}

#### Component 2: {{COMPONENT_2_NAME}}
**Responsibility**: {{COMPONENT_2_RESPONSIBILITY}}

**Interfaces**:
```typescript
interface {{COMPONENT_2_INTERFACE}} {
  {{METHOD_3}}: {{TYPE_3}};
  {{METHOD_4}}: {{TYPE_4}};
}
```

**Implementation Notes**:
{{COMPONENT_2_NOTES}}

---

## Data Model

### Schema Changes

```sql
-- {{TABLE_1}}
CREATE TABLE {{TABLE_1}} (
  {{FIELD_1}} {{TYPE_1}},
  {{FIELD_2}} {{TYPE_2}},
  {{FIELD_3}} {{TYPE_3}}
);

-- {{TABLE_2}}
CREATE TABLE {{TABLE_2}} (
  {{FIELD_4}} {{TYPE_4}},
  {{FIELD_5}} {{TYPE_5}}
);
```

### Data Migration
{{MIGRATION_STRATEGY}}

### Data Flow

```
[Client] ──Request──▶ [API] ──Query──▶ [Database]
                        │
                        └──Cache──▶ [Redis]
```

---

## API Design

### Endpoints

#### `{{ENDPOINT_1}}`
**Method**: {{METHOD_1}}
**Description**: {{ENDPOINT_1_DESC}}

**Request**:
```json
{
  "{{PARAM_1}}": "{{TYPE_1}}",
  "{{PARAM_2}}": "{{TYPE_2}}"
}
```

**Response**:
```json
{
  "{{FIELD_1}}": "{{TYPE_1}}",
  "{{FIELD_2}}": "{{TYPE_2}}"
}
```

**Error Cases**:
- `400`: {{ERROR_400_DESC}}
- `404`: {{ERROR_404_DESC}}
- `500`: {{ERROR_500_DESC}}

#### `{{ENDPOINT_2}}`
**Method**: {{METHOD_2}}
**Description**: {{ENDPOINT_2_DESC}}

{{ENDPOINT_2_DETAILS}}

---

## Security Considerations

### Authentication
{{AUTH_APPROACH}}

### Authorization
{{AUTHZ_APPROACH}}

### Data Protection
- {{PROTECTION_1}}
- {{PROTECTION_2}}

### Threat Model
| Threat | Mitigation |
|--------|-----------|
| {{THREAT_1}} | {{MITIGATION_1}} |
| {{THREAT_2}} | {{MITIGATION_2}} |

---

## Performance Considerations

### Expected Load
- {{LOAD_METRIC_1}}: {{LOAD_VALUE_1}}
- {{LOAD_METRIC_2}}: {{LOAD_VALUE_2}}

### Performance Requirements
- {{PERF_REQ_1}}
- {{PERF_REQ_2}}

### Optimization Strategies
1. {{OPTIMIZATION_1}}
2. {{OPTIMIZATION_2}}
3. {{OPTIMIZATION_3}}

### Monitoring
- {{METRIC_1}}: {{THRESHOLD_1}}
- {{METRIC_2}}: {{THRESHOLD_2}}

---

## Testing Strategy

### Unit Tests
{{UNIT_TEST_APPROACH}}

### Integration Tests
{{INTEGRATION_TEST_APPROACH}}

### E2E Tests
{{E2E_TEST_APPROACH}}

### Test Cases

| Scenario | Input | Expected Output |
|----------|-------|----------------|
| {{SCENARIO_1}} | {{INPUT_1}} | {{OUTPUT_1}} |
| {{SCENARIO_2}} | {{INPUT_2}} | {{OUTPUT_2}} |

---

## Deployment Strategy

### Rollout Plan
1. {{ROLLOUT_STEP_1}}
2. {{ROLLOUT_STEP_2}}
3. {{ROLLOUT_STEP_3}}

### Feature Flags
- `{{FLAG_1}}`: {{FLAG_1_DESC}}
- `{{FLAG_2}}`: {{FLAG_2_DESC}}

### Rollback Plan
{{ROLLBACK_STRATEGY}}

### Monitoring & Alerts
- {{ALERT_1}}
- {{ALERT_2}}

---

## Dependencies

### Internal Dependencies
- [{{DEP_1}}]({{DEP_1_LINK}})
- [{{DEP_2}}]({{DEP_2_LINK}})

### External Dependencies
- {{EXT_DEP_1}}: {{VERSION_1}}
- {{EXT_DEP_2}}: {{VERSION_2}}

### Blocking Issues
- [{{BLOCKING_1}}]({{BLOCKING_1_LINK}})
- [{{BLOCKING_2}}]({{BLOCKING_2_LINK}})

---

## Alternative Approaches

### Alternative 1: {{ALT_1_NAME}}
**Pros**:
- {{PRO_1}}
- {{PRO_2}}

**Cons**:
- {{CON_1}}
- {{CON_2}}

**Why Not Chosen**: {{ALT_1_REASON}}

### Alternative 2: {{ALT_2_NAME}}
**Pros**:
- {{PRO_3}}
- {{PRO_4}}

**Cons**:
- {{CON_3}}
- {{CON_4}}

**Why Not Chosen**: {{ALT_2_REASON}}

---

## Timeline

| Phase | Tasks | Duration | Dependencies |
|-------|-------|----------|-------------|
| Phase 1 | {{PHASE_1_TASKS}} | {{PHASE_1_DURATION}} | {{PHASE_1_DEPS}} |
| Phase 2 | {{PHASE_2_TASKS}} | {{PHASE_2_DURATION}} | {{PHASE_2_DEPS}} |
| Phase 3 | {{PHASE_3_TASKS}} | {{PHASE_3_DURATION}} | {{PHASE_3_DEPS}} |

---

## Open Questions

1. {{QUESTION_1}}
2. {{QUESTION_2}}
3. {{QUESTION_3}}

---

## Future Work

- {{FUTURE_1}}
- {{FUTURE_2}}
- {{FUTURE_3}}

---

## References

- [{{REF_1}}]({{REF_1_LINK}})
- [{{REF_2}}]({{REF_2_LINK}})

---

**Document History**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | {{DATE}} | {{AUTHOR}} | Initial draft |
