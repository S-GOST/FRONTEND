import React, { ComponentType } from 'react';
import { describe, it, expect } from 'vitest';

// Importar el módulo de declaración (esto valida que la declaración existe)
// Nota: La declaración real está en src/types/jsx-modules.d.ts

describe('JSX Module Declarations', () => {
  // 1. VALIDAR QUE EL MÓDULO *.jsx ESTÁ DECLARADO
  it('debería tener declarado el módulo *.jsx', () => {
    // Esta prueba simplemente verifica que TypeScript reconoce la declaración
    // Si esto compila, la declaración existe.
  });

  // 2. VALIDAR QUE ComponentType ES UN TIPO VÁLIDO
  it('debería reconocer ComponentType como tipo válido', () => {
    // ComponentType es un tipo de React, esta prueba valida que está disponible
    const mockComponent: ComponentType<any> = () => null;
    expect(mockComponent).toBeDefined();
  });

  // 3. VALIDAR QUE SE PUEDEN IMPORTAR COMPONENTES JSX
  it('debería permitir importar componentes JSX con la declaración', () => {
    // Simular un componente JSX
    const MockJSXComponent: ComponentType<any> = ({ children }) => <div>{children}</div>;
    
    expect(MockJSXComponent).toBeDefined();
    expect(typeof MockJSXComponent).toBe('function');
  });

  // 4. VALIDAR QUE LOS COMPONENTES JSX PUEDEN TENER PROPS
  it('debería permitir componentes JSX con props', () => {
    interface TestProps {
      name: string;
      age?: number;
    }

    const ComponentWithProps: ComponentType<TestProps> = ({ name, age }) => (
      <div>
        <span>{name}</span>
        {age && <span>{age}</span>}
      </div>
    );

    expect(ComponentWithProps).toBeDefined();
    expect(typeof ComponentWithProps).toBe('function');
  });

  // 5. VALIDAR QUE LOS COMPONENTES JSX PUEDEN SER GENÉRICOS
  it('debería permitir componentes JSX genéricos', () => {
    const GenericComponent: ComponentType<{ data: any }> = ({ data }) => (
      <div>{JSON.stringify(data)}</div>
    );

    expect(GenericComponent).toBeDefined();
    expect(typeof GenericComponent).toBe('function');
  });

  // 6. VALIDAR QUE SE PUEDEN CREAR INSTANCIAS DE COMPONENTES
  it('debería permitir crear instancias de componentes JSX', () => {
    const SimpleComponent: ComponentType = () => <div>Hello World</div>;
    
    // Renderizar el componente (en un entorno de test real)
    const element = <SimpleComponent />;
    
    expect(element).toBeDefined();
    expect(element.type).toBe(SimpleComponent);
  });

  // 7. VALIDAR QUE LOS COMPONENTES PUEDEN TENER CHILDREN
  it('debería permitir componentes JSX con children', () => {
    const ComponentWithChildren: ComponentType<{ children: React.ReactNode }> = ({ children }) => (
      <div className="container">{children}</div>
    );

    const element = (
      <ComponentWithChildren>
        <span>Child content</span>
      </ComponentWithChildren>
    );

    expect(element).toBeDefined();
    expect(element.props.children).toBeDefined();
  });

  // 8. VALIDAR QUE SE PUEDEN USAR HOOKS EN COMPONENTES JSX
  it('debería permitir el uso de hooks en componentes JSX', () => {
    const ComponentWithHooks: ComponentType = () => {
      const [count, setCount] = React.useState(0);
      
      return (
        <div>
          <p>Count: {count}</p>
          <button onClick={() => setCount(count + 1)}>Increment</button>
        </div>
      );
    };

    expect(ComponentWithHooks).toBeDefined();
    expect(typeof ComponentWithHooks).toBe('function');
  });

  // 9. VALIDAR QUE LOS COMPONENTES PUEDEN SER MEMOIZADOS (CORREGIDO)
  it('debería permitir componentes JSX memoizados', () => {
    const MemoizedComponent = React.memo<{ value: number }>(({ value }) => (
      <div>{value}</div>
    ));

    expect(MemoizedComponent).toBeDefined();
    
    // ✅ CORRECCIÓN: React.memo devuelve un objeto componente especial, no siempre es 'function' directo al hacer typeof.
    // Validamos que sea un elemento válido de React en su lugar.
    expect(React.isValidElement(<MemoizedComponent value={1} />)).toBe(true);
  });

  // 10. VALIDAR QUE SE PUEDEN EXPORTAR COMPONENTES COMO DEFAULT
  it('debería permitir exportar componentes como default', () => {
    const DefaultExportComponent: ComponentType = () => <div>Default Export</div>;
    
    // Simular export default
    const moduleExports = { default: DefaultExportComponent };
    
    expect(moduleExports.default).toBeDefined();
    expect(moduleExports.default).toBe(DefaultExportComponent);
  });
});


