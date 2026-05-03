// Vitest global setup — applies to every test file regardless of environment.
// `@testing-library/jest-dom/vitest` is a no-op in Node tests (it just augments
// the `expect` interface) and adds matchers like toBeInTheDocument /
// toHaveTextContent for component tests running under happy-dom.
import '@testing-library/jest-dom/vitest'
