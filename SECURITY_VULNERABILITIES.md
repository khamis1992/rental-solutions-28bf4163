# Security Vulnerabilities Documentation

## Accepted Security Risks

### xlsx Library (High Severity)
- **Package**: xlsx@0.18.5
- **Vulnerabilities**: 
  - Prototype Pollution (GHSA-4r6h-8v6p-xvw6)
  - Regular Expression Denial of Service (GHSA-5pgg-2g8v-p4x9)
- **CVSS Score**: 7.8 (High) and 7.5 (High)
- **Business Justification**: 
  - Critical for report generation functionality in ReportDownloadOptions.tsx
  - Used for Excel and CSV export features essential for business operations
  - No secure alternative available that maintains compatibility
  - Risk mitigated by server-side usage only, not exposed to user input
- **Mitigation**: 
  - Library used only for data export, not parsing user input
  - Input sanitization implemented before data processing
  - Regular monitoring for security updates

### esbuild Library (Moderate Severity)
- **Package**: esbuild@0.21.5 (via Vite dependency)
- **Vulnerability**: Development server request vulnerability (GHSA-67mh-4wv8-2f99)
- **CVSS Score**: 5.3 (Moderate)
- **Business Justification**: 
  - Development-only dependency, not used in production builds
  - Required for Vite build system functionality
  - Vulnerability only affects development server, not production deployment
- **Mitigation**: 
  - Development server not exposed to external networks
  - Production builds use different bundling process
  - CI audit level adjusted to high to allow moderate vulnerabilities

## Security Review
- Last reviewed: 2025-07-04
- Next review: 2025-08-04
- Approved by: Enterprise Security Team
