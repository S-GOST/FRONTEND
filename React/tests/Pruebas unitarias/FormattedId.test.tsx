import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormattedId } from '../../src/componentes/FormattedId';

describe('FormattedId', () => {
  it('should render the formatted id correctly', () => {
    render(<FormattedId entity="cliente" value={1} />);
    expect(screen.getByText('CLI-0001')).toBeInTheDocument();
  });

  it('should handle undefined values correctly', () => {
    render(<FormattedId entity="cliente" value={undefined} />);
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('should apply the provided className', () => {
    render(<FormattedId entity="moto" value={15} className="text-red-500" />);
    const el = screen.getByText('MOTO-0015');
    expect(el).toHaveClass('text-red-500');
    expect(el).toHaveClass('font-mono');
  });
});
