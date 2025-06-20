from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    company = db.Column(db.String(100), nullable=False)
    plan = db.Column(db.String(20), default='free')  # free, starter, professional, enterprise
    analyses_used = db.Column(db.Integer, default=0)
    analyses_limit = db.Column(db.Integer, default=5)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relacionamento com análises
    analyses = db.relationship('Analysis', backref='user', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        """Define a senha do usuário com hash"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verifica se a senha está correta"""
        return check_password_hash(self.password_hash, password)
    
    def can_analyze(self):
        """Verifica se o usuário pode fazer mais análises"""
        return self.analyses_used < self.analyses_limit
    
    def get_remaining_analyses(self):
        """Retorna quantas análises restam"""
        return max(0, self.analyses_limit - self.analyses_used)
    
    def upgrade_plan(self, new_plan):
        """Atualiza o plano do usuário"""
        plan_limits = {
            'free': 5,
            'starter': 50,
            'professional': 200,
            'enterprise': 999999  # Ilimitado
        }
        
        if new_plan in plan_limits:
            self.plan = new_plan
            self.analyses_limit = plan_limits[new_plan]
            # Reset contador ao fazer upgrade
            if new_plan != 'free':
                self.analyses_used = 0
            return True
        return False

    def __repr__(self):
        return f'<User {self.email}>'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'company': self.company,
            'plan': self.plan,
            'analyses_used': self.analyses_used,
            'analyses_limit': self.analyses_limit,
            'remaining_analyses': self.get_remaining_analyses(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'is_active': self.is_active
        }

class Analysis(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(10), nullable=False)
    job_description = db.Column(db.Text)
    
    # Resultados da análise
    score = db.Column(db.Integer)
    experience_years = db.Column(db.Integer)
    seniority_level = db.Column(db.String(20))
    education_level = db.Column(db.String(50))
    job_compatibility = db.Column(db.Integer)
    skills_found = db.Column(db.Text)  # JSON string
    strengths = db.Column(db.Text)  # JSON string
    interview_questions = db.Column(db.Text)  # JSON string
    summary = db.Column(db.Text)
    recommendation = db.Column(db.String(100))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    processing_time = db.Column(db.Float)  # Tempo em segundos

    def __repr__(self):
        return f'<Analysis {self.id} - {self.filename}>'

    def to_dict(self):
        import json
        return {
            'id': self.id,
            'user_id': self.user_id,
            'filename': self.filename,
            'file_type': self.file_type,
            'job_description': self.job_description,
            'score': self.score,
            'experience_years': self.experience_years,
            'seniority_level': self.seniority_level,
            'education_level': self.education_level,
            'job_compatibility': self.job_compatibility,
            'skills_found': json.loads(self.skills_found) if self.skills_found else [],
            'strengths': json.loads(self.strengths) if self.strengths else [],
            'interview_questions': json.loads(self.interview_questions) if self.interview_questions else [],
            'summary': self.summary,
            'recommendation': self.recommendation,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'processing_time': self.processing_time
        }

class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    plan = db.Column(db.String(20), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), default='BRL')
    
    # Dados do Mercado Pago
    payment_id = db.Column(db.String(100))  # ID do pagamento no MP
    preference_id = db.Column(db.String(100))  # ID da preferência no MP
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected, cancelled
    
    # Metadados
    payment_method = db.Column(db.String(50))
    payment_type = db.Column(db.String(50))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamento
    user = db.relationship('User', backref='payments')

    def __repr__(self):
        return f'<Payment {self.id} - {self.plan} - {self.status}>'

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'plan': self.plan,
            'amount': self.amount,
            'currency': self.currency,
            'payment_id': self.payment_id,
            'preference_id': self.preference_id,
            'status': self.status,
            'payment_method': self.payment_method,
            'payment_type': self.payment_type,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
