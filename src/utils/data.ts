import { ChecklistSection } from '../types';
import { 
  Code2, 
  Rocket, 
  MessageSquare, 
  LineChart, 
  FileText, 
  TestTube, 
  ShieldCheck, 
  Settings 
} from 'lucide-react';

export const sections: ChecklistSection[] = [
  {
    id: 'code',
    title: 'Code Standards',
    icon: 'Code2',
    color: 'bg-blue-500',
    items: [
      { id: 'code-1', text: 'Implement clean architecture patterns', checked: false, description: 'Use layered architecture with clear separation of concerns' },
      { id: 'code-2', text: 'Set up linting and code formatting rules', checked: false, description: 'Configure ESLint, Prettier or equivalent tools' },
      { id: 'code-3', text: 'Create API versioning strategy', checked: false, description: 'Plan for backward compatibility and future changes' },
      { id: 'code-4', text: 'Implement proper error handling', checked: false, description: 'Use consistent error codes and messages across services' },
      { id: 'code-5', text: 'Set up dependency injection', checked: false, description: 'Use DI for better testability and loose coupling' },
      { id: 'code-6', text: 'Implement request validation', checked: false, description: 'Validate all incoming requests before processing' },
      { id: 'code-7', text: 'Create consistent logging strategy', checked: false, description: 'Include transaction IDs, timestamps, and severity levels' },
      { id: 'code-8', text: 'Set up API documentation', checked: false, description: 'Use OpenAPI/Swagger for interactive documentation' }
    ]
  },
  {
    id: 'deployment',
    title: 'Deployment & CI/CD',
    icon: 'Rocket',
    color: 'bg-green-500',
    items: [
      { id: 'deploy-1', text: 'Create Dockerfile and container configuration', checked: false, description: 'Use multi-stage builds for optimal image size' },
      { id: 'deploy-2', text: 'Set up CI/CD pipeline', checked: false, description: 'Configure builds, tests, and deployments' },
      { id: 'deploy-3', text: 'Configure Kubernetes manifests', checked: false, description: 'Define deployments, services, and config maps' },
      { id: 'deploy-4', text: 'Implement blue/green deployment strategy', checked: false, description: 'Enable zero-downtime deployments' },
      { id: 'deploy-5', text: 'Set up infrastructure as code', checked: false, description: 'Use Terraform, CloudFormation, or equivalent' },
      { id: 'deploy-6', text: 'Configure environment-specific variables', checked: false, description: 'Manage secrets and environment configurations' },
      { id: 'deploy-7', text: 'Create deployment rollback process', checked: false, description: 'Plan for automated and manual rollback scenarios' },
      { id: 'deploy-8', text: 'Set up release versioning strategy', checked: false, description: 'Use semantic versioning for releases' }
    ]
  },
  {
    id: 'communication',
    title: 'Communication & Integration',
    icon: 'MessageSquare',
    color: 'bg-purple-500',
    items: [
      { id: 'comm-1', text: 'Define service API contracts', checked: false, description: 'Create clear interfaces with other services' },
      { id: 'comm-2', text: 'Set up message broker/queue system', checked: false, description: 'Implement RabbitMQ, Kafka, or equivalent' },
      { id: 'comm-3', text: 'Implement synchronous communication patterns', checked: false, description: 'Define REST or gRPC endpoints' },
      { id: 'comm-4', text: 'Implement asynchronous communication patterns', checked: false, description: 'Use event-driven architecture where appropriate' },
      { id: 'comm-5', text: 'Create service discovery mechanism', checked: false, description: 'Implement service registry and discovery' },
      { id: 'comm-6', text: 'Set up API gateway', checked: false, description: 'Configure routing, authentication, and rate limiting' },
      { id: 'comm-7', text: 'Implement circuit breaker pattern', checked: false, description: 'Handle failures gracefully with fallback mechanisms' },
      { id: 'comm-8', text: 'Create inter-service authentication', checked: false, description: 'Implement service-to-service authentication' }
    ]
  },
  {
    id: 'monitoring',
    title: 'Monitoring & Observability',
    icon: 'LineChart',
    color: 'bg-red-500',
    items: [
      { id: 'monitor-1', text: 'Implement health check endpoints', checked: false, description: 'Create /health and /ready endpoints' },
      { id: 'monitor-2', text: 'Set up centralized logging', checked: false, description: 'Configure ELK stack or equivalent solution' },
      { id: 'monitor-3', text: 'Implement distributed tracing', checked: false, description: 'Set up Jaeger, Zipkin, or equivalent' },
      { id: 'monitor-4', text: 'Configure metrics collection', checked: false, description: 'Use Prometheus or equivalent for metrics' },
      { id: 'monitor-5', text: 'Set up alerting rules', checked: false, description: 'Define SLOs and alert on threshold violations' },
      { id: 'monitor-6', text: 'Create dashboards for key metrics', checked: false, description: 'Visualize service health and performance' },
      { id: 'monitor-7', text: 'Implement log correlation', checked: false, description: 'Use request IDs to track requests across services' },
      { id: 'monitor-8', text: 'Set up performance monitoring', checked: false, description: 'Track response times, error rates, and throughput' }
    ]
  },
  {
    id: 'documentation',
    title: 'Documentation & Knowledge',
    icon: 'FileText',
    color: 'bg-yellow-500',
    items: [
      { id: 'doc-1', text: 'Create service architecture diagram', checked: false, description: 'Document service boundaries and interactions' },
      { id: 'doc-2', text: 'Document data model and schema', checked: false, description: 'Include entity relationships and data flow' },
      { id: 'doc-3', text: 'Create deployment documentation', checked: false, description: 'Document how to deploy and configure the service' },
      { id: 'doc-4', text: 'Set up API documentation', checked: false, description: 'Generate and publish API documentation' },
      { id: 'doc-5', text: 'Create runbook for common issues', checked: false, description: 'Document troubleshooting steps and solutions' },
      { id: 'doc-6', text: 'Document integration points', checked: false, description: 'List all external services and dependencies' },
      { id: 'doc-7', text: 'Create environment setup guide', checked: false, description: 'Document how to set up development environment' },
      { id: 'doc-8', text: 'Maintain decision log', checked: false, description: 'Document key architectural decisions and rationale' }
    ]
  },
  {
    id: 'testing',
    title: 'Testing & Quality',
    icon: 'TestTube',
    color: 'bg-orange-500',
    items: [
      { id: 'test-1', text: 'Create unit testing suite', checked: false, description: 'Test individual components in isolation' },
      { id: 'test-2', text: 'Implement integration tests', checked: false, description: 'Test interactions between components' },
      { id: 'test-3', text: 'Set up contract testing', checked: false, description: 'Verify service meets API contract expectations' },
      { id: 'test-4', text: 'Create end-to-end test scenarios', checked: false, description: 'Test complete user flows across services' },
      { id: 'test-5', text: 'Implement performance testing', checked: false, description: 'Test service under load to identify bottlenecks' },
      { id: 'test-6', text: 'Set up test data management', checked: false, description: 'Create and maintain test data for all environments' },
      { id: 'test-7', text: 'Implement automated test suite', checked: false, description: 'Run tests automatically in CI/CD pipeline' },
      { id: 'test-8', text: 'Create code coverage reporting', checked: false, description: 'Track test coverage and identify gaps' }
    ]
  },
  {
    id: 'security',
    title: 'Security & Compliance',
    icon: 'ShieldCheck',
    color: 'bg-teal-500',
    items: [
      { id: 'sec-1', text: 'Implement authentication mechanism', checked: false, description: 'Use JWT, OAuth, or equivalent' },
      { id: 'sec-2', text: 'Set up authorization rules', checked: false, description: 'Define fine-grained access control' },
      { id: 'sec-3', text: 'Implement secrets management', checked: false, description: 'Use secure vault for managing secrets' },
      { id: 'sec-4', text: 'Set up dependency vulnerability scanning', checked: false, description: 'Scan for vulnerable dependencies regularly' },
      { id: 'sec-5', text: 'Implement data validation and sanitization', checked: false, description: 'Prevent injection attacks and data leaks' },
      { id: 'sec-6', text: 'Create security headers configuration', checked: false, description: 'Set up CORS, CSP, and other security headers' },
      { id: 'sec-7', text: 'Implement rate limiting', checked: false, description: 'Protect against DoS attacks and API abuse' },
      { id: 'sec-8', text: 'Document compliance requirements', checked: false, description: 'List all regulatory requirements and implementations' }
    ]
  },
  {
    id: 'operations',
    title: 'Operations & Maintenance',
    icon: 'Settings',
    color: 'bg-indigo-500',
    items: [
      { id: 'ops-1', text: 'Create backup and recovery plan', checked: false, description: 'Document process for data backup and restore' },
      { id: 'ops-2', text: 'Implement caching strategy', checked: false, description: 'Use appropriate caching layers for performance' },
      { id: 'ops-3', text: 'Set up auto-scaling configuration', checked: false, description: 'Configure horizontal scaling based on load' },
      { id: 'ops-4', text: 'Create incident response process', checked: false, description: 'Document steps for handling production incidents' },
      { id: 'ops-5', text: 'Implement database migration process', checked: false, description: 'Create safe process for schema changes' },
      { id: 'ops-6', text: 'Set up feature flag management', checked: false, description: 'Implement feature toggles for controlled rollouts' },
      { id: 'ops-7', text: 'Create maintenance window process', checked: false, description: 'Document process for scheduled maintenance' },
      { id: 'ops-8', text: 'Implement chaos testing', checked: false, description: 'Test resilience by simulating failures' }
    ]
  }
];