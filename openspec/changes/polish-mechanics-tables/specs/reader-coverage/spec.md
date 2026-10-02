## ADDED Requirements

### Requirement: Coverage gaps have concise previews

Each nonempty coverage gap SHALL show its affected page count, a plain explanation of what readers can and cannot find, and a small linked preview. A long list SHALL initially show eight pages and reveal the rest on request so that one gap does not bury the others. Coverage SHALL NOT describe collection machinery to readers.

#### Scenario: Hundreds of affected pages
- **WHEN** a gap names more than ten affected pages
- **THEN** eight linked examples appear with a Show N more control that reveals the rest
