import mercadopago
import os
from datetime import datetime
from typing import Dict, Optional

class MercadoPagoIntegration:
    """Integração com Mercado Pago para processamento de pagamentos"""
    
    def __init__(self, access_token: str = None):
        # Token de acesso (usar variável de ambiente em produção)
        self.access_token = access_token or os.getenv('MERCADO_PAGO_ACCESS_TOKEN', 'TEST-ACCESS-TOKEN')
        self.sdk = mercadopago.SDK(self.access_token)
        
        # Configurações dos planos
        self.plans = {
            'starter': {
                'name': 'Plano Starter',
                'price': 47.00,
                'analyses': 50,
                'description': '50 análises por mês + Relatórios básicos + Suporte por email'
            },
            'professional': {
                'name': 'Plano Professional',
                'price': 97.00,
                'analyses': 200,
                'description': '200 análises por mês + Relatórios avançados + Dashboard completo + Suporte prioritário'
            },
            'enterprise': {
                'name': 'Plano Enterprise',
                'price': 197.00,
                'analyses': 999999,
                'description': 'Análises ilimitadas + API dedicada + Suporte 24/7 + Consultoria inclusa'
            }
        }

    def create_preference(self, user_data: Dict, plan: str, success_url: str = None, 
                         failure_url: str = None, pending_url: str = None) -> Dict:
        """Cria uma preferência de pagamento no Mercado Pago"""
        
        if plan not in self.plans:
            raise ValueError(f"Plano '{plan}' não encontrado")
        
        plan_info = self.plans[plan]
        
        # URLs de retorno (usar URLs do frontend em produção)
        base_url = success_url.split('/success')[0] if success_url else 'https://selecionei.com'
        
        preference_data = {
            "items": [
                {
                    "title": plan_info['name'],
                    "description": plan_info['description'],
                    "quantity": 1,
                    "currency_id": "BRL",
                    "unit_price": plan_info['price']
                }
            ],
            "payer": {
                "name": user_data.get('name', ''),
                "email": user_data.get('email', ''),
                "phone": {
                    "area_code": "11",
                    "number": user_data.get('phone', '999999999')
                }
            },
            "back_urls": {
                "success": success_url or f"{base_url}/payment/success",
                "failure": failure_url or f"{base_url}/payment/failure", 
                "pending": pending_url or f"{base_url}/payment/pending"
            },
            "auto_return": "approved",
            "external_reference": f"user_{user_data.get('id')}_{plan}_{int(datetime.now().timestamp())}",
            "notification_url": f"{base_url}/api/payment/webhook",
            "statement_descriptor": "SELECIONEI",
            "expires": True,
            "expiration_date_from": datetime.now().isoformat(),
            "expiration_date_to": (datetime.now().replace(hour=23, minute=59, second=59)).isoformat()
        }
        
        try:
            preference_response = self.sdk.preference().create(preference_data)
            
            if preference_response["status"] == 201:
                return {
                    'success': True,
                    'preference_id': preference_response["response"]["id"],
                    'init_point': preference_response["response"]["init_point"],
                    'sandbox_init_point': preference_response["response"]["sandbox_init_point"],
                    'external_reference': preference_data['external_reference']
                }
            else:
                return {
                    'success': False,
                    'error': 'Erro ao criar preferência de pagamento',
                    'details': preference_response
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Erro na integração: {str(e)}'
            }

    def get_payment_info(self, payment_id: str) -> Dict:
        """Busca informações de um pagamento específico"""
        try:
            payment_response = self.sdk.payment().get(payment_id)
            
            if payment_response["status"] == 200:
                payment_data = payment_response["response"]
                
                return {
                    'success': True,
                    'payment_id': payment_data['id'],
                    'status': payment_data['status'],
                    'status_detail': payment_data['status_detail'],
                    'amount': payment_data['transaction_amount'],
                    'currency': payment_data['currency_id'],
                    'payment_method': payment_data.get('payment_method_id'),
                    'payment_type': payment_data.get('payment_type_id'),
                    'external_reference': payment_data.get('external_reference'),
                    'payer_email': payment_data.get('payer', {}).get('email'),
                    'date_created': payment_data.get('date_created'),
                    'date_approved': payment_data.get('date_approved')
                }
            else:
                return {
                    'success': False,
                    'error': 'Pagamento não encontrado'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Erro ao buscar pagamento: {str(e)}'
            }

    def process_webhook(self, webhook_data: Dict) -> Dict:
        """Processa webhook do Mercado Pago"""
        try:
            # Verificar se é notificação de pagamento
            if webhook_data.get('type') == 'payment':
                payment_id = webhook_data.get('data', {}).get('id')
                
                if payment_id:
                    # Buscar informações do pagamento
                    payment_info = self.get_payment_info(str(payment_id))
                    
                    if payment_info['success']:
                        return {
                            'success': True,
                            'action': 'payment_update',
                            'payment_info': payment_info
                        }
                    else:
                        return {
                            'success': False,
                            'error': 'Erro ao processar webhook'
                        }
                else:
                    return {
                        'success': False,
                        'error': 'ID do pagamento não encontrado no webhook'
                    }
            else:
                return {
                    'success': True,
                    'action': 'ignored',
                    'message': 'Tipo de webhook não processado'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Erro ao processar webhook: {str(e)}'
            }

    def get_plan_info(self, plan: str) -> Optional[Dict]:
        """Retorna informações de um plano específico"""
        return self.plans.get(plan)

    def get_all_plans(self) -> Dict:
        """Retorna todos os planos disponíveis"""
        return self.plans

    def validate_payment_status(self, status: str) -> str:
        """Valida e normaliza status de pagamento"""
        status_mapping = {
            'approved': 'approved',
            'pending': 'pending',
            'in_process': 'pending',
            'rejected': 'rejected',
            'cancelled': 'cancelled',
            'refunded': 'refunded',
            'charged_back': 'refunded'
        }
        
        return status_mapping.get(status, 'unknown')

    def generate_payment_link(self, user_data: Dict, plan: str, base_url: str = None) -> Dict:
        """Gera link de pagamento direto"""
        try:
            success_url = f"{base_url}/payment/success" if base_url else None
            failure_url = f"{base_url}/payment/failure" if base_url else None
            pending_url = f"{base_url}/payment/pending" if base_url else None
            
            preference = self.create_preference(
                user_data=user_data,
                plan=plan,
                success_url=success_url,
                failure_url=failure_url,
                pending_url=pending_url
            )
            
            if preference['success']:
                return {
                    'success': True,
                    'payment_url': preference['init_point'],
                    'preference_id': preference['preference_id'],
                    'plan_info': self.plans[plan]
                }
            else:
                return preference
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Erro ao gerar link: {str(e)}'
            }

