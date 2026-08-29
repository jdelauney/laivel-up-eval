---
title: Code concepts
description: Complete reference for code smells, SOLID principles, and refactoring patterns
version: 1.0
---

<refactoring_library>
  <metadata>
    <title>Code concepts</title>
    <description>Complete reference for code smells, SOLID principles, and refactoring patterns</description>
    <version>1.1</version>
  </metadata>

  <!-- ============================================================
       FOUNDATIONAL PRINCIPLES
       ============================================================ -->
  <principles>

    <principle id="KISS" name="Keep It Simple, Stupid">
      <description>Simplicity should be a key goal in design. Avoid unnecessary complexity.</description>
      <indicators>
        <smell>Overly clever one-liners that sacrifice readability</smell>
        <smell>Deep nesting (> 3 levels)</smell>
        <smell>Functions doing multiple unrelated things</smell>
        <smell>Premature optimization</smell>
        <smell>Abstract factories for single implementations</smell>
      </indicators>
      <refactoring>
        <action>Break complex expressions into named intermediate variables</action>
        <action>Flatten nested conditions with early returns (guard clauses)</action>
        <action>Split multi-purpose functions into single-purpose ones</action>
        <action>Remove abstractions that don't earn their complexity</action>
      </refactoring>
    </principle>

    <principle id="DRY" name="Don't Repeat Yourself">
      <description>Every piece of knowledge must have a single, unambiguous representation.</description>
      <indicators>
        <smell>Copy-pasted code blocks</smell>
        <smell>Similar logic in multiple places with slight variations</smell>
        <smell>Magic numbers/strings repeated across files</smell>
        <smell>Parallel class hierarchies</smell>
      </indicators>
      <refactoring>
        <action>Extract common logic into reusable functions</action>
        <action>Create shared utilities or helper modules</action>
        <action>Define constants for repeated values</action>
        <action>Use parameterization to unify similar code paths</action>
      </refactoring>
      <caution>Don't confuse accidental duplication with true duplication - similar-looking code serving different purposes may diverge later</caution>
    </principle>

    <principle id="YAGNI" name="You Ain't Gonna Need It">
      <description>Don't add functionality until it's actually needed.</description>
      <indicators>
        <smell>Unused parameters or methods</smell>
        <smell>Speculative generality (interfaces with one implementation)</smell>
        <smell>Feature flags for features never shipped</smell>
        <smell>Dead code paths</smell>
      </indicators>
      <refactoring>
        <action>Remove unused code ruthlessly</action>
        <action>Eliminate unnecessary abstractions</action>
        <action>Resist adding "nice to have" improvements</action>
        <action>Keep refactoring scope strictly defined</action>
      </refactoring>
    </principle>

    <principle_group id="SOLID" name="SOLID Design Principles">
      
      <principle id="SRP" name="Single Responsibility Principle">
        <description>A module should have one, and only one, reason to change.</description>
        <indicators>
          <smell>Classes with "And" in the name (UserAndOrderManager)</smell>
          <smell>Methods longer than 20-30 lines</smell>
          <smell>Classes that change for multiple unrelated reasons</smell>
          <smell>God classes that know too much</smell>
          <smell>More than 5-7 dependencies injected</smell>
        </indicators>
        <patterns>
          <pattern>Extract Class</pattern>
          <pattern>Extract Method</pattern>
          <pattern>Move Method</pattern>
        </patterns>
      </principle>

      <principle id="OCP" name="Open/Closed Principle">
        <description>Open for extension, closed for modification.</description>
        <indicators>
          <smell>Switch statements on type codes</smell>
          <smell>Frequent modifications to existing classes for new features</smell>
          <smell>Long if-else chains checking object types</smell>
        </indicators>
        <patterns>
          <pattern>Replace Conditional with Polymorphism</pattern>
          <pattern>Strategy Pattern</pattern>
          <pattern>Template Method Pattern</pattern>
        </patterns>
      </principle>

      <principle id="LSP" name="Liskov Substitution Principle">
        <description>Subtypes must be substitutable for their base types.</description>
        <indicators>
          <smell>Subclasses that throw "NotImplemented" exceptions</smell>
          <smell>Type checks before calling methods</smell>
          <smell>Subclasses that violate parent class contracts</smell>
        </indicators>
        <patterns>
          <pattern>Extract Superclass (properly)</pattern>
          <pattern>Replace Inheritance with Composition</pattern>
          <pattern>Push Down Method</pattern>
        </patterns>
      </principle>

      <principle id="ISP" name="Interface Segregation Principle">
        <description>Clients should not depend on interfaces they don't use.</description>
        <indicators>
          <smell>Fat interfaces with many methods</smell>
          <smell>Classes implementing interfaces with empty/stub methods</smell>
          <smell>Interface changes affecting unrelated clients</smell>
        </indicators>
        <patterns>
          <pattern>Extract Interface</pattern>
          <pattern>Split interface by client need</pattern>
        </patterns>
      </principle>

      <principle id="DIP" name="Dependency Inversion Principle">
        <description>Depend on abstractions, not concretions.</description>
        <indicators>
          <smell>Direct instantiation of dependencies (new ConcreteClass())</smell>
          <smell>Hard-coded database/API calls in business logic</smell>
          <smell>Tight coupling between layers</smell>
        </indicators>
        <patterns>
          <pattern>Dependency Injection</pattern>
          <pattern>Extract Interface for dependencies</pattern>
          <pattern>Repository/Gateway patterns</pattern>
        </patterns>
      </principle>

    </principle_group>

    <principle id="SoC" name="Separation of Concerns">
      <description>Divide code into distinct sections, each addressing a separate concern.</description>
      <indicators>
        <smell>UI logic mixed with business logic</smell>
        <smell>Data access code in controllers</smell>
        <smell>Validation scattered across layers</smell>
        <smell>Cross-cutting concerns duplicated everywhere</smell>
      </indicators>
      <refactoring>
        <action>Extract layers (presentation, business, data)</action>
        <action>Create dedicated service classes</action>
        <action>Centralize cross-cutting concerns</action>
        <action>Apply appropriate architectural patterns</action>
      </refactoring>
    </principle>

  </principles>

  <!-- ============================================================
       CODE SMELLS CATALOG
       ============================================================ -->
  <code_smells>

    <category id="bloaters" name="Bloaters">
      <description>Code that has grown too large to be easily managed</description>
      
      <smell id="long_method">
        <name>Long Method</name>
        <detection>
          <heuristic>More than 20-30 lines</heuristic>
          <heuristic>Multiple levels of abstraction</heuristic>
          <heuristic>Hard to name - doing too many things</heuristic>
          <heuristic>Requires scrolling to read</heuristic>
          <heuristic>More than 2-3 levels of nesting</heuristic>
        </detection>
        <refactorings>
          <pattern primary="true">Extract Method</pattern>
          <pattern>Replace Temp with Query</pattern>
          <pattern>Introduce Parameter Object</pattern>
          <pattern>Decompose Conditional</pattern>
        </refactorings>
      </smell>

      <smell id="large_class">
        <name>Large Class / God Class</name>
        <detection>
          <heuristic>More than 200-300 lines</heuristic>
          <heuristic>Too many instance variables (>7)</heuristic>
          <heuristic>Multiple distinct responsibilities</heuristic>
          <heuristic>Low cohesion - methods don't use same fields</heuristic>
          <heuristic>Name includes Manager, Handler, Processor, Controller with many methods</heuristic>
        </detection>
        <refactorings>
          <pattern primary="true">Extract Class</pattern>
          <pattern>Extract Subclass</pattern>
          <pattern>Extract Interface</pattern>
        </refactorings>
      </smell>

      <smell id="long_parameter_list">
        <name>Long Parameter List</name>
        <detection>
          <heuristic>More than 3-4 parameters</heuristic>
          <heuristic>Boolean flags as parameters</heuristic>
          <heuristic>Parameters that always travel together</heuristic>
          <heuristic>Null parameters passed frequently</heuristic>
        </detection>
        <refactorings>
          <pattern primary="true">Introduce Parameter Object</pattern>
          <pattern>Replace Parameter with Method Call</pattern>
          <pattern>Preserve Whole Object</pattern>
        </refactorings>
      </smell>

      <smell id="primitive_obsession">
        <name>Primitive Obsession</name>
        <detection>
          <heuristic>Using primitives for domain concepts (string for email, int for money)</heuristic>
          <heuristic>Constants for type codes</heuristic>
          <heuristic>String parsing throughout code</heuristic>
          <heuristic>Validation logic repeated for same data</heuristic>
        </detection>
        <refactorings>
          <pattern primary="true">Replace Primitive with Object</pattern>
          <pattern>Replace Type Code with Class</pattern>
          <pattern>Replace Type Code with Subclasses</pattern>
        </refactorings>
      </smell>

      <smell id="data_clumps">
        <name>Data Clumps</name>
        <detection>
          <heuristic>Same group of variables passed together repeatedly</heuristic>
          <heuristic>Same fields in multiple classes</heuristic>
          <heuristic>Related parameters always appearing together</heuristic>
        </detection>
        <refactorings>
          <pattern primary="true">Extract Class</pattern>
          <pattern>Introduce Parameter Object</pattern>
          <pattern>Preserve Whole Object</pattern>
        </refactorings>
      </smell>
    </category>

    <category id="oo_abusers" name="Object-Orientation Abusers">
      <description>Incorrect application of OO principles</description>

      <smell id="switch_statements">
        <name>Switch Statements / Long If-Else</name>
        <detection>
          <heuristic>Switch on type code</heuristic>
          <heuristic>Same switch repeated in multiple places</heuristic>
          <heuristic>Type checking with instanceof/typeof</heuristic>
          <heuristic>If-else chain with >3 branches</heuristic>
        </detection>
        <refactorings>
          <pattern primary="true">Replace Conditional with Polymorphism</pattern>
          <pattern>Replace Type Code with Subclasses</pattern>
          <pattern>Replace Type Code with Strategy</pattern>
        </refactorings>
      </smell>

      <smell id="refused_bequest">
        <name>Refused Bequest</name>
        <detection>
          <heuristic>Subclass only uses few inherited methods</heuristic>
          <heuristic>Overriding methods to do nothing</heuristic>
          <heuristic>Throwing NotImplemented exceptions</heuristic>
        </detection>
        <refactorings>
          <pattern primary="true">Replace Inheritance with Delegation</pattern>
          <pattern>Extract Subclass</pattern>
          <pattern>Push Down Method</pattern>
        </refactorings>
      </smell>

      <smell id="temporary_field">
        <name>Temporary Field</name>
        <detection>
          <heuristic>Instance variables only used sometimes</heuristic>
          <heuristic>Fields that are null most of the time</heuristic>
          <heuristic>Complex conditional logic around field validity</heuristic>
        </detection>
        <refactorings>
          <pattern primary="true">Extract Class</pattern>
          <pattern>Introduce Null Object</pattern>
          <pattern>Replace Method with Method Object</pattern>
        </refactorings>
      </smell>
    </category>

    <category id="change_preventers" name="Change Preventers">
      <description>Structures that make changes difficult</description>

      <smell id="divergent_change">
        <name>Divergent Change</name>
        <detection>
          <heuristic>One class changed for multiple different reasons</heuristic>
          <heuristic>Changes to unrelated features affect same class</heuristic>
          <heuristic>"When I change X, I also change methods A, B; when I change Y, I change C, D"</heuristic>
        </detection>
        <refactorings>
          <pattern primary="true">Extract Class</pattern>
          <pattern>Extract Superclass</pattern>
        </refactorings>
      </smell>

      <smell id="shotgun_surgery">
        <name>Shotgun Surgery</name>
        <detection>
          <heuristic>Small change requires modifications in many classes</heuristic>
          <heuristic>Related code scattered across the codebase</heuristic>
          <heuristic>Adding a feature touches 5+ files</heuristic>
        </detection>
        <refactorings>
          <pattern primary="true">Move Method</pattern>
          <pattern>Move Field</pattern>
          <pattern>Inline Class (to consolidate)</pattern>
        </refactorings>
      </smell>

      <smell id="parallel_inheritance">
        <name>Parallel Inheritance Hierarchies</name>
        <detection>
          <heuristic>Creating subclass in one hierarchy requires subclass in another</heuristic>
          <heuristic>Prefixes of class names match across hierarchies</heuristic>
        </detection>
        <refactorings>
          <pattern primary="true">Move Method/Field to eliminate one hierarchy</pattern>
        </refactorings>
      </smell>
    </category>

    <category id="dispensables" name="Dispensables">
      <description>Code that serves no purpose</description>

      <smell id="dead_code">
        <name>Dead Code</name>
        <detection>
          <heuristic>Unreachable code paths</heuristic>
          <heuristic>Unused variables, parameters, methods</heuristic>
          <heuristic>Commented-out code</heuristic>
          <heuristic>Unused imports</heuristic>
          <heuristic>Conditions that are always true/false</heuristic>
        </detection>
        <refactorings>
          <pattern primary="true">Remove Dead Code</pattern>
        </refactorings>
      </smell>

      <smell id="speculative_generality">
        <name>Speculative Generality</name>
        <detection>
          <heuristic>Abstract classes with single implementation</heuristic>
          <heuristic>Unused hooks or extension points</heuristic>
          <heuristic>"Future-proofing" without current need</heuristic>
          <heuristic>Overly generic names (doProcess, handleData)</heuristic>
        </detection>
        <refactorings>
          <pattern primary="true">Collapse Hierarchy</pattern>
          <pattern>Inline Class</pattern>
          <pattern>Remove Parameter</pattern>
        </refactorings>
      </smell>

      <smell id="lazy_class">
        <name>Lazy Class</name>
        <detection>
          <heuristic>Class that doesn't do enough to justify existence</heuristic>
          <heuristic>Classes created for "future use"</heuristic>
          <heuristic>Wrapper classes that just delegate</heuristic>
        </detection>
        <refactorings>
          <pattern primary="true">Inline Class</pattern>
          <pattern>Collapse Hierarchy</pattern>
        </refactorings>
      </smell>

      <smell id="duplicate_code">
        <name>Duplicate Code</name>
        <detection>
          <heuristic>Identical or very similar code in multiple places</heuristic>
          <heuristic>Same algorithm implemented differently</heuristic>
          <heuristic>Copy-paste with minor modifications</heuristic>
        </detection>
        <refactorings>
          <pattern primary="true">Extract Method</pattern>
          <pattern>Extract Class</pattern>
          <pattern>Pull Up Method</pattern>
          <pattern>Form Template Method</pattern>
        </refactorings>
      </smell>

      <smell id="comments">
        <name>Excessive Comments</name>
        <detection>
          <heuristic>Comments explaining what code does (not why)</heuristic>
          <heuristic>Commented-out code</heuristic>
          <heuristic>Comments that don't match the code</heuristic>
          <heuristic>TODOs that will never be done</heuristic>
        </detection>
        <refactorings>
          <pattern primary="true">Extract Method (with good name)</pattern>
          <pattern>Rename (to self-documenting names)</pattern>
          <pattern>Remove Dead Code</pattern>
        </refactorings>
      </smell>
    </category>

    <category id="couplers" name="Couplers">
      <description>Excessive coupling between classes</description>

      <smell id="feature_envy">
        <name>Feature Envy</name>
        <detection>
          <heuristic>Method uses more features of another class than its own</heuristic>
          <heuristic>Excessive getter calls on another object</heuristic>
          <heuristic>Method would be simpler if moved to another class</heuristic>
        </detection>
        <refactorings>
          <pattern primary="true">Move Method</pattern>
          <pattern>Extract Method + Move</pattern>
        </refactorings>
      </smell>

      <smell id="inappropriate_intimacy">
        <name>Inappropriate Intimacy</name>
        <detection>
          <heuristic>Classes that know too much about each other's internals</heuristic>
          <heuristic>Bidirectional dependencies</heuristic>
          <heuristic>Accessing private/internal members</heuristic>
        </detection>
        <refactorings>
          <pattern primary="true">Move Method/Field</pattern>
          <pattern>Extract Class (to mediate)</pattern>
          <pattern>Replace Inheritance with Delegation</pattern>
        </refactorings>
      </smell>

      <smell id="message_chains">
        <name>Message Chains</name>
        <detection>
          <heuristic>Long chains: a.getB().getC().getD().doSomething()</heuristic>
          <heuristic>Law of Demeter violations</heuristic>
          <heuristic>Chained optional/null checks</heuristic>
        </detection>
        <refactorings>
          <pattern primary="true">Hide Delegate</pattern>
          <pattern>Extract Method</pattern>
          <pattern>Move Method</pattern>
        </refactorings>
      </smell>

      <smell id="middle_man">
        <name>Middle Man</name>
        <detection>
          <heuristic>Class that only delegates to another class</heuristic>
          <heuristic>Most methods just forward calls</heuristic>
          <heuristic>No value added by the intermediary</heuristic>
        </detection>
        <refactorings>
          <pattern primary="true">Remove Middle Man</pattern>
          <pattern>Inline Method</pattern>
        </refactorings>
      </smell>
    </category>

    <!-- ============================================================
         NEW: PERFORMANCE ANTI-PATTERNS
         ============================================================ -->
    <category id="performance_killers" name="Performance Killers">
      <description>Patterns that silently degrade application performance</description>

      <smell id="barrel_exports">
        <name>Barrel Exports / Index Re-exports</name>
        <severity>HIGH</severity>
        <impact>
          <metric>Bundle size increase: 30-85%</metric>
          <metric>Load time increase: up to 44%</metric>
          <metric>Module count explosion: 3x-10x more modules loaded</metric>
          <metric>Cold start degradation in serverless: 200-800ms per import</metric>
          <metric>Dev server startup: 5-10 seconds instead of 1-2 seconds</metric>
        </impact>
        <description>
          Barrel files (index.ts/js) that re-export modules from a directory prevent effective 
          tree-shaking. When importing from a barrel, bundlers must parse the entire file and 
          often include all re-exported modules, even if only one is used.
        </description>
        <detection>
          <heuristic>index.ts/js files containing only export statements</heuristic>
          <heuristic>Import paths ending with folder name: import { X } from './components'</heuristic>
          <heuristic>Import from package root: import { Icon } from 'lucide-react'</heuristic>
          <heuristic>Multiple export * from statements in one file</heuristic>
          <heuristic>Unusually large bundle sizes for simple pages</heuristic>
          <heuristic>Slow dev server startup or page refresh</heuristic>
        </detection>
        <examples>
          <bad_example title="Barrel file creating bloat"><![CDATA[
// ❌ components/index.ts (BARREL FILE - AVOID)
export { Button } from './Button';
export { Input } from './Input';
export { Modal } from './Modal';
export { Table } from './Table';
// ... 50 more exports

// ❌ Importing from barrel - loads ALL components
import { Button } from '@/components';

// ❌ Icon library barrel - loads 1000+ icons
import { User, Settings, Home } from 'lucide-react';

// ❌ Utility library barrel - loads entire library
import { debounce, throttle } from 'lodash';

// ❌ UI library barrel
import { Button, TextField } from '@mui/material';
          ]]></bad_example>
          <good_example title="Direct imports"><![CDATA[
// ✅ Direct import - loads only Button
import { Button } from '@/components/Button';

// ✅ Direct icon import - loads only these icons
import { User } from 'lucide-react/dist/esm/icons/user';
import { Settings } from 'lucide-react/dist/esm/icons/settings';
import { Home } from 'lucide-react/dist/esm/icons/home';

// ✅ Direct lodash import - loads only these functions
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';

// ✅ Direct MUI import
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
          ]]></good_example>
        </examples>
        <refactorings>
          <pattern primary="true">Replace Barrel Import with Direct Import</pattern>
          <pattern>Configure optimizePackageImports (Next.js 13.1+)</pattern>
          <pattern>Configure modularizeImports (legacy)</pattern>
          <pattern>Use path aliases for convenience without barrels</pattern>
          <pattern>Add ESLint rule no-barrel-files</pattern>
        </refactorings>
        <nextjs_config><![CDATA[
// next.config.js - For external packages you can't change
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Auto-optimize these packages' barrel imports
    optimizePackageImports: [
      'lucide-react',
      '@heroicons/react',
      '@phosphor-icons/react',
      '@radix-ui/react-icons',
      '@mantine/core',
      '@mantine/hooks',
      'date-fns',
      'lodash',
      'lodash-es',
      '@mui/material',
      '@mui/icons-material',
      '@headlessui/react',
      'rxjs',
      'recharts',
      '@tanstack/react-query',
    ],
  },
  // Alternative: explicit transforms (more control)
  modularizeImports: {
    'lodash': {
      transform: 'lodash/{{member}}',
    },
    '@mui/material': {
      transform: '@mui/material/{{member}}',
    },
    '@mui/icons-material': {
      transform: '@mui/icons-material/{{member}}',
    },
  },
};

module.exports = nextConfig;
        ]]></nextjs_config>
        <eslint_rule><![CDATA[
// .eslintrc.js - Prevent barrel imports
module.exports = {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@/components', '@/components/index'],
            message: 'Import directly from component file, e.g., @/components/Button',
          },
          {
            group: ['@/utils', '@/utils/index'],
            message: 'Import directly from util file, e.g., @/utils/formatDate',
          },
          {
            group: ['@/hooks', '@/hooks/index'],
            message: 'Import directly from hook file, e.g., @/hooks/useAuth',
          },
          {
            group: ['lodash'],
            message: 'Import from lodash/[module] instead, e.g., lodash/debounce',
          },
        ],
      },
    ],
    // Or use: eslint-plugin-barrel-files
    // 'barrel-files/avoid-barrel-files': 'error',
    // 'barrel-files/avoid-importing-barrel-files': 'error',
    // 'barrel-files/avoid-re-export-all': 'error',
  },
};
        ]]></eslint_rule>
        <tsconfig_paths><![CDATA[
// tsconfig.json - Use path aliases WITHOUT barrel files
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      // Point to folders, not index files
      "@/components/*": ["./src/components/*"],
      "@/utils/*": ["./src/utils/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/lib/*": ["./src/lib/*"]
    }
  }
}

// Usage: import { Button } from '@/components/Button';
// NOT:   import { Button } from '@/components';
        ]]></tsconfig_paths>
        <exceptions>
          <exception>Library entry points (package.json main field) - necessary for publishing</exception>
          <exception>Shared design systems where ALL exports are used together</exception>
          <exception>When optimizePackageImports handles the package automatically</exception>
        </exceptions>
        <migration_checklist>
          <step>1. Analyze bundle with @next/bundle-analyzer to identify bloated chunks</step>
          <step>2. Find all index.ts/js barrel files in your codebase</step>
          <step>3. Update imports to use direct paths</step>
          <step>4. Configure optimizePackageImports for external packages</step>
          <step>5. Add ESLint rules to prevent regression</step>
          <step>6. Delete barrel files (or keep empty to avoid import errors during migration)</step>
          <step>7. Re-analyze bundle to verify improvements</step>
        </migration_checklist>
      </smell>

    </category>

  </code_smells>

  <!-- ============================================================
       REFACTORING PATTERNS CATALOG
       ============================================================ -->
  <refactoring_patterns>

    <category id="composing_methods" name="Composing Methods">
      
      <pattern id="extract_method">
        <name>Extract Method</name>
        <intent>Turn a code fragment into a method whose name explains its purpose</intent>
        <mechanics>
          <step>1. Create new method with intention-revealing name</step>
          <step>2. Copy extracted code to new method</step>
          <step>3. Identify local variables - pass as parameters or return</step>
          <step>4. Replace original code with method call</step>
          <step>5. Compile and test</step>
        </mechanics>
        <example>
          <before><![CDATA[
function printOwing() {
  // print banner
  console.log("**************************");
  console.log("***** Customer Owes ******");
  console.log("**************************");
  
  // calculate outstanding
  let outstanding = 0;
  for (const order of orders) {
    outstanding += order.amount;
  }
  
  // print details
  console.log(`name: ${name}`);
  console.log(`amount: ${outstanding}`);
}
          ]]></before>
          <after><![CDATA[
function printOwing() {
  printBanner();
  const outstanding = calculateOutstanding();
  printDetails(outstanding);
}

function printBanner() {
  console.log("**************************");
  console.log("***** Customer Owes ******");
  console.log("**************************");
}

function calculateOutstanding() {
  return orders.reduce((sum, order) => sum + order.amount, 0);
}

function printDetails(outstanding: number) {
  console.log(`name: ${name}`);
  console.log(`amount: ${outstanding}`);
}
          ]]></after>
        </example>
      </pattern>

      <pattern id="inline_method">
        <name>Inline Method</name>
        <intent>Replace a method call with the method's body</intent>
        <when>Method body is as clear as the name, or excessive indirection</when>
        <mechanics>
          <step>1. Check method is not polymorphic</step>
          <step>2. Find all calls to the method</step>
          <step>3. Replace each call with method body</step>
          <step>4. Remove the method definition</step>
          <step>5. Compile and test</step>
        </mechanics>
      </pattern>

      <pattern id="extract_variable">
        <name>Extract Variable / Introduce Explaining Variable</name>
        <intent>Put a complex expression into a temporary variable with a meaningful name</intent>
        <mechanics>
          <step>1. Declare a well-named immutable variable</step>
          <step>2. Set it to the result of the expression</step>
          <step>3. Replace original expression with variable reference</step>
        </mechanics>
        <example>
          <before><![CDATA[
if (platform.toUpperCase().indexOf("MAC") > -1 &&
    browser.toUpperCase().indexOf("IE") > -1 &&
    wasInitialized() && resize > 0) {
  // do something
}
          ]]></before>
          <after><![CDATA[
const isMacOS = platform.toUpperCase().indexOf("MAC") > -1;
const isIE = browser.toUpperCase().indexOf("IE") > -1;
const wasResized = resize > 0;

if (isMacOS && isIE && wasInitialized() && wasResized) {
  // do something
}
          ]]></after>
        </example>
      </pattern>

      <pattern id="replace_temp_with_query">
        <name>Replace Temp with Query</name>
        <intent>Replace temporary variable with a method call</intent>
        <when>Temporary is used multiple times, or extracting improves clarity</when>
      </pattern>

    </category>

    <category id="moving_features" name="Moving Features">
      
      <pattern id="move_method">
        <name>Move Method</name>
        <intent>Move a method to the class that uses it most</intent>
        <mechanics>
          <step>1. Examine all features used by source method</step>
          <step>2. Check sub/superclasses for other declarations</step>
          <step>3. Declare method in target class</step>
          <step>4. Copy code, adjust for new home</step>
          <step>5. Turn source into delegating method or remove</step>
          <step>6. Compile and test</step>
        </mechanics>
      </pattern>

      <pattern id="move_field">
        <name>Move Field</name>
        <intent>Move a field to the class that uses it most</intent>
      </pattern>

      <pattern id="extract_class">
        <name>Extract Class</name>
        <intent>Create a new class and move relevant fields and methods</intent>
        <when>A class is doing work that should be done by two</when>
        <mechanics>
          <step>1. Decide how to split responsibilities</step>
          <step>2. Create new class for split-off responsibilities</step>
          <step>3. Create link from old to new class</step>
          <step>4. Move fields one at a time</step>
          <step>5. Move methods one at a time</step>
          <step>6. Review interfaces, minimize exposure</step>
        </mechanics>
      </pattern>

      <pattern id="inline_class">
        <name>Inline Class</name>
        <intent>Move all features into another class and delete the empty class</intent>
        <when>A class isn't doing enough to justify its existence</when>
      </pattern>

      <pattern id="hide_delegate">
        <name>Hide Delegate</name>
        <intent>Create a method on the server to hide the delegate</intent>
        <when>Client calls a method on an object returned by another method</when>
        <example>
          <before><![CDATA[
// Client code
const manager = person.getDepartment().getManager();
          ]]></before>
          <after><![CDATA[
// Client code
const manager = person.getManager();

// Person class
getManager() {
  return this.department.getManager();
}
          ]]></after>
        </example>
      </pattern>

    </category>

    <category id="organizing_data" name="Organizing Data">
      
      <pattern id="replace_primitive_with_object">
        <name>Replace Primitive with Object</name>
        <intent>Replace a primitive with a small object (Value Object)</intent>
        <example>
          <before><![CDATA[
let telephone: string = "555-1234";
          ]]></before>
          <after><![CDATA[
class TelephoneNumber {
  constructor(private readonly number: string) {
    this.validate(number);
  }
  
  private validate(number: string) { /* ... */ }
  getAreaCode() { /* ... */ }
  format() { /* ... */ }
}

const telephone = new TelephoneNumber("555-1234");
          ]]></after>
        </example>
      </pattern>

      <pattern id="replace_magic_number">
        <name>Replace Magic Number with Symbolic Constant</name>
        <intent>Replace literal number with a well-named constant</intent>
        <example>
          <before><![CDATA[
const potentialEnergy = mass * 9.81 * height;
          ]]></before>
          <after><![CDATA[
const GRAVITATIONAL_CONSTANT = 9.81;
const potentialEnergy = mass * GRAVITATIONAL_CONSTANT * height;
          ]]></after>
        </example>
      </pattern>

      <pattern id="encapsulate_field">
        <name>Encapsulate Field</name>
        <intent>Make a public field private and provide accessors</intent>
      </pattern>

      <pattern id="replace_type_code_with_class">
        <name>Replace Type Code with Class/Enum</name>
        <intent>Replace numeric type code with a class or enumeration</intent>
      </pattern>

    </category>

    <category id="simplifying_conditionals" name="Simplifying Conditionals">
      
      <pattern id="decompose_conditional">
        <name>Decompose Conditional</name>
        <intent>Extract methods from condition, then-part, and else-part</intent>
        <example>
          <before><![CDATA[
if (date.before(SUMMER_START) || date.after(SUMMER_END)) {
  charge = quantity * winterRate + winterServiceCharge;
} else {
  charge = quantity * summerRate;
}
          ]]></before>
          <after><![CDATA[
if (isWinter(date)) {
  charge = winterCharge(quantity);
} else {
  charge = summerCharge(quantity);
}
          ]]></after>
        </example>
      </pattern>

      <pattern id="consolidate_conditional">
        <name>Consolidate Conditional Expression</name>
        <intent>Combine multiple conditionals that lead to same result</intent>
        <example>
          <before><![CDATA[
if (isNotEligibleForDisability()) return 0;
if (seniority < 2) return 0;
if (monthsDisabled > 12) return 0;
          ]]></before>
          <after><![CDATA[
if (isNotEligibleForDisability() || seniority < 2 || monthsDisabled > 12) {
  return 0;
}
          ]]></after>
        </example>
      </pattern>

      <pattern id="replace_nested_with_guard">
        <name>Replace Nested Conditional with Guard Clauses</name>
        <intent>Use guard clauses (early returns) for special cases</intent>
        <example>
          <before><![CDATA[
function getPayAmount() {
  let result;
  if (isDead) {
    result = deadAmount();
  } else {
    if (isSeparated) {
      result = separatedAmount();
    } else {
      if (isRetired) {
        result = retiredAmount();
      } else {
        result = normalPayAmount();
      }
    }
  }
  return result;
}
          ]]></before>
          <after><![CDATA[
function getPayAmount() {
  if (isDead) return deadAmount();
  if (isSeparated) return separatedAmount();
  if (isRetired) return retiredAmount();
  return normalPayAmount();
}
          ]]></after>
        </example>
      </pattern>

      <pattern id="replace_conditional_with_polymorphism">
        <name>Replace Conditional with Polymorphism</name>
        <intent>Move each leg of the conditional to an overriding method</intent>
        <when>Conditional switches on type code or object type</when>
      </pattern>

      <pattern id="introduce_null_object">
        <name>Introduce Null Object / Special Case</name>
        <intent>Replace null checks with a null object providing default behavior</intent>
      </pattern>

    </category>

    <category id="simplifying_calls" name="Simplifying Method Calls">
      
      <pattern id="rename_method">
        <name>Rename Method</name>
        <intent>Change the name to better reveal its purpose</intent>
        <guidance>Name should describe WHAT it does, not HOW</guidance>
      </pattern>

      <pattern id="introduce_parameter_object">
        <name>Introduce Parameter Object</name>
        <intent>Replace related parameters with an object</intent>
        <when>Same group of parameters appears together repeatedly</when>
        <example>
          <before><![CDATA[
function amountInvoiced(startDate: Date, endDate: Date) { }
function amountReceived(startDate: Date, endDate: Date) { }
function amountOverdue(startDate: Date, endDate: Date) { }
          ]]></before>
          <after><![CDATA[
interface DateRange {
  start: Date;
  end: Date;
}

function amountInvoiced(range: DateRange) { }
function amountReceived(range: DateRange) { }
function amountOverdue(range: DateRange) { }
          ]]></after>
        </example>
      </pattern>

      <pattern id="preserve_whole_object">
        <name>Preserve Whole Object</name>
        <intent>Pass the whole object instead of extracting values</intent>
      </pattern>

      <pattern id="replace_parameter_with_method">
        <name>Replace Parameter with Method Call</name>
        <intent>Remove parameter when receiver can call method directly</intent>
      </pattern>

      <pattern id="separate_query_from_modifier">
        <name>Separate Query from Modifier</name>
        <intent>Split method into query (returns value) and modifier (changes state)</intent>
        <rule>A method should either return a value or have side effects, not both</rule>
      </pattern>

    </category>

    <!-- ============================================================
        IMPORT OPTIMIZATION PATTERNS
         ============================================================ -->
    <category id="import_optimization" name="Import Optimization">
      
      <pattern id="replace_barrel_with_direct">
        <name>Replace Barrel Import with Direct Import</name>
        <intent>Replace imports from index/barrel files with direct module imports</intent>
        <when>Importing from barrel files causes bundle bloat or slow dev server</when>
        <mechanics>
          <step>1. Identify the actual file path of the module you need</step>
          <step>2. Replace the barrel import with the direct path</step>
          <step>3. Update tsconfig paths if needed for convenience</step>          
        </mechanics>
        <example>
          <before><![CDATA[
// Barrel imports - entire module tree loaded
import { Button, Input } from '@/components';
import { debounce } from 'lodash';
import { User, Settings } from 'lucide-react';
import { format, addDays } from 'date-fns';
          ]]></before>
          <after><![CDATA[
// Direct imports - only needed modules loaded
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { format } from 'date-fns/format';
import { addDays } from 'date-fns/addDays';
          ]]></after>
        </example>
      </pattern>

    </category>

  </refactoring_patterns>

  <attached_references>
    <skill>[component-pattern](.claude/skills/user/component-pattern)</skill>
    <skill>[service-layer](.claude/skills/user/service-layer)</skill>
    <skill>[clean-code-typescript](.claude/skills/user/clean-code-typescript)</skill>
  </attached_references>

</refactoring_library>
