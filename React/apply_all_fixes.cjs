const fs = require("fs");
const file = "tests/Pruebas unitarias/Servicios.test.tsx";
let code = fs.readFileSync(file, "utf-8");

// 1. Jest to Vi
code = code.replace(/jest\.mocked/g, "vi.mocked");

// 2. Wrap in MemoryRouter
code = code.replace(/<Servicios \/>/g, "<MemoryRouter><Servicios /></MemoryRouter>");
if (!code.includes("import { MemoryRouter }")) {
  code = "import { MemoryRouter } from 'react-router-dom';\n" + code;
}

// 3. Fix sweetalert mock
code = code.replace(
  /vi\.mock\('sweetalert2', \(\) => \(\{[\s\S]*?\}\)\);/g,
  "vi.mock('sweetalert2', () => ({ default: { fire: vi.fn() } }));"
);

// 4. Fix Test 9 (getAllByText)
code = code.replace(
  /expect\(screen\.getByText\('Reparación'\)\)\.toBeInTheDocument\(\);/g,
  "expect(screen.getAllByText('Reparación')[0]).toBeInTheDocument();"
);
// Also Test 9 has btnEditar multiple elements error
code = code.replace(
  /const btnEditar = screen\.getByTitle\('Editar'\);/g,
  "const btnEditar = screen.getAllByTitle('Editar')[0];"
);

// 5. Fix Test 13 and 14 inputs and Swal clear
code = code.replace(/\/\/ 13\. VALIDACIÓN DE PRECIO MAYOR A 0[\s\S]*?\/\/ 14\. CREAR SERVICIO EXITOSAMENTE/, 
`// 13. VALIDACIÓN DE PRECIO MAYOR A 0
  it('debería rechazar precios menores o iguales a 0', async () => {
    render(<MemoryRouter><Servicios /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /nuevo servicio/i }));

    const modal = screen.getByText('Crear Servicio').closest('.modal-container') as HTMLElement;
    
    fireEvent.change(modal.querySelector('input[name="ID_SERVICIOS"]')!, { target: { name: 'ID_SERVICIOS', value: '3' } });
    fireEvent.change(modal.querySelector('select[name="ID_CATEGORIA"]')!, { target: { name: 'ID_CATEGORIA', value: '30' } });
    fireEvent.change(modal.querySelector('input[name="Nombre"]')!, { target: { name: 'Nombre', value: 'Lavado' } });
    fireEvent.change(modal.querySelector('input[name="Precio"]')!, { target: { name: 'Precio', value: '0' } });

    vi.mocked(Swal.fire).mockClear();
    fireEvent.submit(modal.querySelector('form')!);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ text: 'Debe ingresar un precio válido mayor a 0.', icon: 'warning' })
      );
    });
  });

  // 14. CREAR SERVICIO EXITOSAMENTE`);

code = code.replace(/\/\/ 14\. CREAR SERVICIO EXITOSAMENTE[\s\S]*/, 
`// 14. CREAR SERVICIO EXITOSAMENTE
  it('debería crear el servicio con categoría y precio como números', async () => {
    vi.mocked(servicioService.insertarServicio).mockResolvedValue({ data: { success: true } } as any);
    render(<MemoryRouter><Servicios /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /nuevo servicio/i }));

    const modal = screen.getByText('Crear Servicio').closest('.modal-container') as HTMLElement;
    
    fireEvent.change(modal.querySelector('input[name="ID_SERVICIOS"]')!, { target: { name: 'ID_SERVICIOS', value: '3' } });
    fireEvent.change(modal.querySelector('select[name="ID_CATEGORIA"]')!, { target: { name: 'ID_CATEGORIA', value: '30' } });
    fireEvent.change(modal.querySelector('input[name="Nombre"]')!, { target: { name: 'Nombre', value: 'Lavado' } });
    fireEvent.change(modal.querySelector('input[name="Precio"]')!, { target: { name: 'Precio', value: '30000' } });

    vi.mocked(Swal.fire).mockClear();
    fireEvent.submit(modal.querySelector('form')!);

    await waitFor(() => {
      expect(servicioService.insertarServicio).toHaveBeenCalledWith(
        expect.objectContaining({
          ID_SERVICIOS: '3',
          ID_CATEGORIA: 30,
          Nombre: 'Lavado',
          Estado: 'Disponible',
          Precio: 30000,
        })
      );
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Servicio creado', icon: 'success' })
      );
    });
  });
});
`);

fs.writeFileSync(file, code);
