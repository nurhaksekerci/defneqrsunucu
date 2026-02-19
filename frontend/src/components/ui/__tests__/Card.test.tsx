import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardContent } from '../Card';

describe('Card Components', () => {
  describe('Card', () => {
    it('should render children', () => {
      render(
        <Card>
          <div>Card content</div>
        </Card>
      );
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('should support custom className', () => {
      const { container } = render(<Card className="custom-card">Content</Card>);
      expect(container.firstChild).toHaveClass('custom-card');
    });
  });

  describe('CardHeader', () => {
    it('should render header content', () => {
      render(
        <CardHeader>
          <div>Header content</div>
        </CardHeader>
      );
      expect(screen.getByText('Header content')).toBeInTheDocument();
    });
  });

  describe('CardTitle', () => {
    it('should render title text', () => {
      render(<CardTitle>Card Title</CardTitle>);
      expect(screen.getByText('Card Title')).toBeInTheDocument();
    });

    it('should render as h2 by default', () => {
      const { container } = render(<CardTitle>Title</CardTitle>);
      expect(container.querySelector('h2')).toBeInTheDocument();
    });
  });

  describe('CardContent', () => {
    it('should render content', () => {
      render(
        <CardContent>
          <p>Content text</p>
        </CardContent>
      );
      expect(screen.getByText('Content text')).toBeInTheDocument();
    });
  });

  describe('Full Card Structure', () => {
    it('should render complete card with all components', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is the card content</p>
          </CardContent>
        </Card>
      );

      expect(screen.getByText('Test Card')).toBeInTheDocument();
      expect(screen.getByText('This is the card content')).toBeInTheDocument();
    });
  });
});
