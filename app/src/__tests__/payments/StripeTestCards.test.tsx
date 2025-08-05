import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MembershipPaymentForm from '@/components/payments/MembershipPaymentForm';

// Mock fetch for payment intent creation
global.fetch = jest.fn();

// Mock Stripe
jest.mock('@stripe/react-stripe-js', () => {
  const mockConfirmPayment = jest.fn();
  const mockElements = {
    create: jest.fn(),
    getElement: jest.fn(),
  };
  
  return {
    Elements: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    PaymentElement: () => <div data-testid="payment-element">Payment Form</div>,
    useStripe: () => ({
      confirmPayment: mockConfirmPayment,
    }),
    useElements: () => mockElements,
    __mockConfirmPayment: mockConfirmPayment,
    __mockElements: mockElements,
  };
});

jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve({
    confirmPayment: jest.fn(),
    elements: jest.fn(() => ({})),
  })),
}));

// Get mocks after they're defined
const { __mockConfirmPayment: mockConfirmPayment, __mockElements: mockElements } = jest.requireMock('@stripe/react-stripe-js');

describe('Stripe Test Card Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Successful Payment Scenarios', () => {
    beforeEach(() => {
      // Mock successful payment intent creation
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          clientSecret: 'pi_test_success_secret',
          paymentIntentId: 'pi_test_success',
        }),
      });
    });

    it('should process payment successfully with test card 4242 4242 4242 4242', async () => {
      const onSuccess = jest.fn();
      
      render(<MembershipPaymentForm onSuccess={onSuccess} />);

      // Select $15 membership
      const basicMembership = screen.getByLabelText(/Basic Membership - \$15/);
      fireEvent.click(basicMembership);

      // Click continue
      const continueButton = screen.getByRole('button', { name: /Continue with \$15.00/ });
      fireEvent.click(continueButton);

      // Wait for payment form to load
      await waitFor(() => {
        expect(screen.getByTestId('payment-element')).toBeInTheDocument();
      });

      // Mock successful payment confirmation
      mockConfirmPayment.mockResolvedValueOnce({
        error: null,
        paymentIntent: {
          id: 'pi_test_success',
          status: 'succeeded',
        },
      });

      // Submit payment
      const payButton = screen.getByRole('button', { name: /Pay Now/ });
      fireEvent.click(payButton);

      await waitFor(() => {
        expect(mockConfirmPayment).toHaveBeenCalledWith({
          elements: mockElements,
          confirmParams: {
            return_url: expect.stringContaining('/membership/payment-success'),
          },
        });
      });
    });

    it('should handle 3D Secure authentication with card 4000 0025 0000 3155', async () => {
      const onSuccess = jest.fn();
      
      render(<MembershipPaymentForm onSuccess={onSuccess} />);

      // Select custom amount
      const customOption = screen.getByLabelText(/Choose your amount/);
      fireEvent.click(customOption);

      // Enter custom amount
      const amountInput = screen.getByPlaceholderText('Enter amount');
      await userEvent.type(amountInput, '75');

      // Click continue
      const continueButton = screen.getByRole('button', { name: /Continue with \$75.00/ });
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(screen.getByTestId('payment-element')).toBeInTheDocument();
      });

      // Mock 3D Secure flow
      mockConfirmPayment.mockResolvedValueOnce({
        error: null,
        paymentIntent: {
          id: 'pi_test_3ds',
          status: 'requires_action',
          next_action: {
            type: 'use_stripe_sdk',
          },
        },
      });

      const payButton = screen.getByRole('button', { name: /Pay Now/ });
      fireEvent.click(payButton);

      await waitFor(() => {
        expect(mockConfirmPayment).toHaveBeenCalled();
      });
    });
  });

  describe('Failed Payment Scenarios', () => {
    beforeEach(() => {
      // Mock successful payment intent creation
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          clientSecret: 'pi_test_fail_secret',
          paymentIntentId: 'pi_test_fail',
        }),
      });
    });

    it('should handle declined card 4000 0000 0000 0002', async () => {
      render(<MembershipPaymentForm />);

      // Select membership and continue to payment
      fireEvent.click(screen.getByLabelText(/Supporting Membership - \$25/));
      fireEvent.click(screen.getByRole('button', { name: /Continue with \$25.00/ }));

      await waitFor(() => {
        expect(screen.getByTestId('payment-element')).toBeInTheDocument();
      });

      // Mock declined payment
      mockConfirmPayment.mockResolvedValueOnce({
        error: {
          type: 'card_error',
          code: 'card_declined',
          message: 'Your card was declined.',
        },
        paymentIntent: null,
      });

      const payButton = screen.getByRole('button', { name: /Pay Now/ });
      fireEvent.click(payButton);

      await waitFor(() => {
        expect(screen.getByText('Your card was declined.')).toBeInTheDocument();
      });
    });

    it('should handle insufficient funds card 4000 0000 0000 9995', async () => {
      render(<MembershipPaymentForm />);

      fireEvent.click(screen.getByLabelText(/Patron Membership - \$50/));
      fireEvent.click(screen.getByRole('button', { name: /Continue with \$50.00/ }));

      await waitFor(() => {
        expect(screen.getByTestId('payment-element')).toBeInTheDocument();
      });

      mockConfirmPayment.mockResolvedValueOnce({
        error: {
          type: 'card_error',
          code: 'insufficient_funds',
          message: 'Your card has insufficient funds.',
        },
        paymentIntent: null,
      });

      const payButton = screen.getByRole('button', { name: /Pay Now/ });
      fireEvent.click(payButton);

      await waitFor(() => {
        expect(screen.getByText('Your card has insufficient funds.')).toBeInTheDocument();
      });
    });

    it('should handle processing error card 4000 0000 0000 0119', async () => {
      render(<MembershipPaymentForm />);

      fireEvent.click(screen.getByLabelText(/Basic Membership - \$15/));
      fireEvent.click(screen.getByRole('button', { name: /Continue with \$15.00/ }));

      await waitFor(() => {
        expect(screen.getByTestId('payment-element')).toBeInTheDocument();
      });

      mockConfirmPayment.mockResolvedValueOnce({
        error: {
          type: 'api_error',
          message: 'An error occurred while processing your card. Please try again.',
        },
        paymentIntent: null,
      });

      const payButton = screen.getByRole('button', { name: /Pay Now/ });
      fireEvent.click(payButton);

      await waitFor(() => {
        expect(screen.getByText(/An error occurred while processing your card/)).toBeInTheDocument();
      });
    });
  });

  describe('Validation Scenarios', () => {
    it('should validate minimum payment amount', async () => {
      render(<MembershipPaymentForm />);

      // Select custom amount
      fireEvent.click(screen.getByLabelText(/Choose your amount/));
      
      const amountInput = screen.getByPlaceholderText('Enter amount');
      await userEvent.type(amountInput, '0.50');

      const continueButton = screen.getByRole('button', { name: /Continue/ });
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter an amount of at least $1.00')).toBeInTheDocument();
      });
    });

    it('should validate maximum payment amount', async () => {
      render(<MembershipPaymentForm />);

      fireEvent.click(screen.getByLabelText(/Choose your amount/));
      
      const amountInput = screen.getByPlaceholderText('Enter amount');
      await userEvent.type(amountInput, '150');

      const continueButton = screen.getByRole('button', { name: /Continue/ });
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter an amount less than $100.00')).toBeInTheDocument();
      });
    });
  });

  describe('Network Error Scenarios', () => {
    it('should handle network errors gracefully', async () => {
      render(<MembershipPaymentForm />);

      // Select membership amount
      const basicMembership = screen.getByLabelText(/Basic Membership - \$15/);
      fireEvent.click(basicMembership);
      
      // Mock network error for the payment intent creation
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      // Click continue button
      const continueButton = screen.getByRole('button', { name: /Continue with \$15.00/ });
      fireEvent.click(continueButton);

      // Wait for error message to appear - the component shows "Network error" for network failures
      await waitFor(() => {
        const alerts = screen.getAllByRole('alert');
        expect(alerts.length).toBeGreaterThan(0);
        expect(alerts[0]).toHaveTextContent('Network error');
      });
    });

    it('should handle API errors from payment intent creation', async () => {
      render(<MembershipPaymentForm />);

      fireEvent.click(screen.getByLabelText(/Basic Membership - \$15/));
      
      // Mock API error response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Payment service unavailable',
        }),
      });
      
      fireEvent.click(screen.getByRole('button', { name: /Continue with \$15.00/ }));

      await waitFor(() => {
        expect(screen.getByText('Payment service unavailable')).toBeInTheDocument();
      });
    });
  });
});