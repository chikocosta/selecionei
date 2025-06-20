import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from src.models.user import db, User, Analysis, Payment
from src.routes.user import user_bp
from src.ai_analyzer import IntelligentResumeAnalyzer
from src.mercado_pago import MercadoPagoIntegration
import datetime
import json
import time

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'selecionei_secret_key_2024')
CORS(app)

app.register_blueprint(user_bp, url_prefix='/api')

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    db.create_all()

# Inicializar IA e Mercado Pago
ai_analyzer = IntelligentResumeAnalyzer()
mp_integration = MercadoPagoIntegration()

@app.route('/api/health')
def health_check():
    return jsonify({
        "status": "OK", 
        "service": "Selecionei API", 
        "ai_enabled": True,
        "payment_enabled": True
    })

@app.route('/api/analyze', methods=['POST'])
def analyze_resume_endpoint():
    try:
        # Verificar se há arquivo
        if 'file' not in request.files:
            return jsonify({'error': 'Nenhum arquivo enviado'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'Nenhum arquivo selecionado'}), 400
        
        # Verificar tipo de arquivo
        allowed_extensions = {'.pdf', '.txt', '.doc', '.docx'}
        file_ext = os.path.splitext(file.filename)[1].lower()
        
        if file_ext not in allowed_extensions:
            return jsonify({'error': 'Tipo de arquivo não suportado. Use PDF, TXT, DOC ou DOCX'}), 400
        
        # Ler conteúdo do arquivo
        file_content = file.read()
        
        if len(file_content) == 0:
            return jsonify({'error': 'Arquivo vazio'}), 400
        
        # Obter dados do usuário (opcional para análise gratuita)
        user_id = request.form.get('user_id')
        job_description = request.form.get('job_description', '')
        
        # Verificar limites se usuário logado
        if user_id:
            user = User.query.get(int(user_id))
            if user and not user.can_analyze():
                return jsonify({
                    'error': 'Limite de análises atingido',
                    'remaining': 0,
                    'plan': user.plan
                }), 403
        
        # Marcar tempo de início
        start_time = time.time()
        
        # Realizar análise com IA
        analysis_result = ai_analyzer.analyze_resume(
            file_content, 
            file.filename, 
            job_description if job_description else None
        )
        
        # Calcular tempo de processamento
        processing_time = time.time() - start_time
        
        # Salvar análise no banco se usuário logado
        if user_id:
            user = User.query.get(int(user_id))
            if user:
                # Criar registro da análise
                analysis = Analysis(
                    user_id=user.id,
                    filename=file.filename,
                    file_type=file_ext,
                    job_description=job_description,
                    score=analysis_result['pontuacao_geral'],
                    experience_years=analysis_result['experiencia_anos'],
                    seniority_level=analysis_result['nivel_senioridade'],
                    education_level=analysis_result.get('educacao', ''),
                    job_compatibility=analysis_result.get('compatibilidade_vaga'),
                    skills_found=json.dumps(analysis_result['skills_tecnicas']),
                    strengths=json.dumps(analysis_result['pontos_fortes']),
                    interview_questions=json.dumps(analysis_result['perguntas_entrevista']),
                    summary=analysis_result['resumo'],
                    recommendation=analysis_result['recomendacao'],
                    processing_time=processing_time
                )
                
                # Incrementar contador de uso
                user.analyses_used += 1
                
                db.session.add(analysis)
                db.session.commit()
        
        return jsonify({
            'success': True,
            'analysis': analysis_result,
            'filename': file.filename,
            'processed_at': datetime.datetime.now().isoformat(),
            'processing_time': round(processing_time, 2),
            'ai_version': '2.0'
        })
        
    except Exception as e:
        return jsonify({'error': f'Erro na análise: {str(e)}'}), 500

@app.route('/api/stats')
def get_stats():
    """Retorna estatísticas da plataforma"""
    # Buscar estatísticas reais do banco
    total_users = User.query.count()
    total_analyses = User.query.with_entities(db.func.sum(User.analyses_used)).scalar() or 0
    
    return jsonify({
        'total_analyses': int(total_analyses) + 4200,  # Base + real
        'active_users': total_users + 1200,  # Base + real
        'satisfaction_rate': 4.9,
        'time_saved_hours': int(total_analyses * 7.5) + 15000  # 7.5h economizadas por análise
    })

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validar dados
        required_fields = ['name', 'email', 'password', 'company']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        # Verificar se email já existe
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({'error': 'Email já cadastrado'}), 400
        
        # Criar novo usuário
        new_user = User(
            name=data['name'],
            email=data['email'],
            company=data['company'],
            plan='free',
            analyses_used=0,
            analyses_limit=5
        )
        new_user.set_password(data['password'])
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Usuário criado com sucesso',
            'user': new_user.to_dict()
        })
        
    except Exception as e:
        return jsonify({'error': f'Erro ao criar usuário: {str(e)}'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if 'email' not in data or 'password' not in data:
            return jsonify({'error': 'Email e senha são obrigatórios'}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if user and user.check_password(data['password']):
            # Atualizar último login
            user.last_login = datetime.datetime.utcnow()
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Login realizado com sucesso',
                'user': user.to_dict()
            })
        else:
            return jsonify({'error': 'Email ou senha incorretos'}), 401
            
    except Exception as e:
        return jsonify({'error': f'Erro no login: {str(e)}'}), 500

@app.route('/api/user/<int:user_id>/analyses')
def get_user_analyses(user_id):
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        analyses = Analysis.query.filter_by(user_id=user_id).order_by(Analysis.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'analyses': [analysis.to_dict() for analysis in analyses],
            'total': len(analyses)
        })
        
    except Exception as e:
        return jsonify({'error': f'Erro ao buscar análises: {str(e)}'}), 500

# ENDPOINTS DE PAGAMENTO

@app.route('/api/plans')
def get_plans():
    """Retorna todos os planos disponíveis"""
    return jsonify({
        'success': True,
        'plans': mp_integration.get_all_plans()
    })

@app.route('/api/payment/create', methods=['POST'])
def create_payment():
    try:
        data = request.get_json()
        
        required_fields = ['user_id', 'plan']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        user = User.query.get(data['user_id'])
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        plan = data['plan']
        plan_info = mp_integration.get_plan_info(plan)
        if not plan_info:
            return jsonify({'error': 'Plano inválido'}), 400
        
        # Dados do usuário para o MP
        user_data = {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'phone': data.get('phone', '11999999999')
        }
        
        # URL base do frontend
        base_url = data.get('base_url', 'https://selecionei.com')
        
        # Criar preferência no MP
        payment_result = mp_integration.generate_payment_link(user_data, plan, base_url)
        
        if payment_result['success']:
            # Salvar pagamento no banco
            payment = Payment(
                user_id=user.id,
                plan=plan,
                amount=plan_info['price'],
                preference_id=payment_result['preference_id'],
                status='pending'
            )
            
            db.session.add(payment)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'payment_url': payment_result['payment_url'],
                'preference_id': payment_result['preference_id'],
                'plan_info': payment_result['plan_info']
            })
        else:
            return jsonify(payment_result), 400
            
    except Exception as e:
        return jsonify({'error': f'Erro ao criar pagamento: {str(e)}'}), 500

@app.route('/api/payment/webhook', methods=['POST'])
def payment_webhook():
    try:
        webhook_data = request.get_json()
        
        # Processar webhook
        result = mp_integration.process_webhook(webhook_data)
        
        if result['success'] and result.get('action') == 'payment_update':
            payment_info = result['payment_info']
            
            # Buscar pagamento no banco pelo external_reference
            external_ref = payment_info.get('external_reference', '')
            if external_ref:
                # Extrair user_id do external_reference (formato: user_123_plan_timestamp)
                parts = external_ref.split('_')
                if len(parts) >= 2:
                    user_id = int(parts[1])
                    
                    # Buscar pagamento pendente do usuário
                    payment = Payment.query.filter_by(
                        user_id=user_id,
                        status='pending'
                    ).order_by(Payment.created_at.desc()).first()
                    
                    if payment:
                        # Atualizar status do pagamento
                        payment.payment_id = payment_info['payment_id']
                        payment.status = mp_integration.validate_payment_status(payment_info['status'])
                        payment.payment_method = payment_info.get('payment_method')
                        payment.payment_type = payment_info.get('payment_type')
                        
                        # Se pagamento aprovado, atualizar plano do usuário
                        if payment.status == 'approved':
                            user = User.query.get(user_id)
                            if user:
                                user.upgrade_plan(payment.plan)
                        
                        db.session.commit()
        
        return jsonify({'status': 'ok'})
        
    except Exception as e:
        print(f"Erro no webhook: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/<int:user_id>/payments')
def get_user_payments(user_id):
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        payments = Payment.query.filter_by(user_id=user_id).order_by(Payment.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'payments': [payment.to_dict() for payment in payments],
            'total': len(payments)
        })
        
    except Exception as e:
        return jsonify({'error': f'Erro ao buscar pagamentos: {str(e)}'}), 500

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)

