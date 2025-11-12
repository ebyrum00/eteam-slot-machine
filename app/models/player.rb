class Player < ApplicationRecord
  has_many :spins, dependent: :destroy

  validates :name, presence: true, length: { minimum: 1, maximum: 100 }
  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :phone, presence: true

  # Daily leaderboard calculation - groups by email, ranks by best single spin
  def self.daily_leaderboard(date = Date.today)
    joins(:spins)
      .where(spins: { created_at: date.beginning_of_day..date.end_of_day })
      .group('players.email')
      .select(
        'MAX(players.id) as id',
        'MAX(players.name) as name',
        'players.email',
        'MAX(spins.total_score) as total_score',
        'COUNT(spins.id) as spin_count',
        'MAX(spins.total_score) as best_score',
        'MAX(spins.id) as best_spin_id'
      )
      .order('total_score DESC')
      .limit(10)
      .map.with_index do |player, index|
        {
          rank: index + 1,
          player_id: player.id,
          name: player.name,
          total_score: player.total_score.to_i,
          spin_count: player.spin_count,
          best_spin_id: player.best_spin_id
        }
      end
  end
end
